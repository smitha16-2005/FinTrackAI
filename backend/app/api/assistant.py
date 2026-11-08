from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from openai import (
    APIConnectionError,
    APIStatusError,
    RateLimitError
)
from sqlalchemy import select
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm import Session

from app.api.dependencies import get_current_user
from app.db.dependencies import get_db
from app.models.user import User
from app.models.assistant import (
    AssistantConversation,
    AssistantMessage
)
from app.schemas.assistant import (
    AssistantChatRequest,
    AssistantChatResponse,
    AssistantConversationResponse,
    AssistantMessageResponse
)
from app.services.financial_context import get_financial_context
from app.services.ai_assistant import generate_assistant_response


router = APIRouter(
    prefix="/assistant",
    tags=["AI Financial Assistant"]
)


@router.post(
    "/chat",
    response_model=AssistantChatResponse
)
def chat_with_assistant(
    payload: AssistantChatRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    message = payload.message.strip()

    if not message:
        raise HTTPException(
            status_code=400,
            detail="Message cannot be empty."
        )

    try:
        if payload.conversation_id:
            conversation = db.scalar(
                select(AssistantConversation).where(
                    AssistantConversation.id == payload.conversation_id,
                    AssistantConversation.user_id == current_user.id
                )
            )

            if conversation is None:
                raise HTTPException(
                    status_code=404,
                    detail="Conversation not found."
                )

        else:
            conversation = AssistantConversation(
                user_id=current_user.id,
                title=message[:120]
            )

            db.add(conversation)
            db.flush()

        previous_messages = db.scalars(
            select(AssistantMessage)
            .where(
                AssistantMessage.conversation_id == conversation.id
            )
            .order_by(
                AssistantMessage.created_at.desc(),
                AssistantMessage.id.desc()
            )
            .limit(12)
        ).all()

        conversation_history = [
            {
                "role": item.role,
                "content": item.content
            }
            for item in reversed(previous_messages)
        ]

        financial_context = get_financial_context(
            db,
            current_user.id
        )

        assistant_answer = generate_assistant_response(
            message=message,
            conversation_history=conversation_history,
            financial_context=financial_context
        )

        user_message = AssistantMessage(
            conversation_id=conversation.id,
            role="user",
            content=message
        )

        assistant_message = AssistantMessage(
            conversation_id=conversation.id,
            role="assistant",
            content=assistant_answer
        )

        db.add_all([
            user_message,
            assistant_message
        ])

        db.commit()

        return AssistantChatResponse(
            conversation_id=conversation.id,
            user_message=message,
            assistant_message=assistant_answer
        )

    except HTTPException:
        db.rollback()
        raise

    except RateLimitError:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="The AI service is temporarily rate limited. Please try again later."
        )

    except APIConnectionError:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Unable to connect to the AI service."
        )

    except APIStatusError:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="The AI service returned an error."
        )

    except RuntimeError as exc:
        db.rollback()

        if "API key is not configured" in str(exc):
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="AI assistant is not configured."
            )

        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="Unable to generate an AI response."
        )

    except SQLAlchemyError:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Unable to save the conversation."
        )


@router.get(
    "/conversations",
    response_model=list[AssistantConversationResponse]
)
def get_conversations(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    conversations = db.scalars(
        select(AssistantConversation)
        .where(
            AssistantConversation.user_id == current_user.id
        )
        .order_by(AssistantConversation.created_at.desc())
    ).all()

    return conversations


@router.get(
    "/conversations/{conversation_id}/messages",
    response_model=list[AssistantMessageResponse]
)
def get_conversation_messages(
    conversation_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    conversation = db.scalar(
        select(AssistantConversation).where(
            AssistantConversation.id == conversation_id,
            AssistantConversation.user_id == current_user.id
        )
    )

    if conversation is None:
        raise HTTPException(
            status_code=404,
            detail="Conversation not found."
        )

    messages = db.scalars(
        select(AssistantMessage)
        .where(
            AssistantMessage.conversation_id == conversation_id
        )
        .order_by(
            AssistantMessage.created_at.asc(),
            AssistantMessage.id.asc()
        )
    ).all()

    return messages


@router.delete(
    "/conversations/{conversation_id}",
    status_code=status.HTTP_204_NO_CONTENT
)
def delete_conversation(
    conversation_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    conversation = db.scalar(
        select(AssistantConversation).where(
            AssistantConversation.id == conversation_id,
            AssistantConversation.user_id == current_user.id
        )
    )

    if conversation is None:
        raise HTTPException(
            status_code=404,
            detail="Conversation not found."
        )

    try:
        db.delete(conversation)
        db.commit()

    except SQLAlchemyError:
        db.rollback()
        raise HTTPException(
            status_code=500,
            detail="Unable to delete conversation."
        )