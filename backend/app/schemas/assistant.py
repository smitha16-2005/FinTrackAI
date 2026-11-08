from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field


class AssistantChatRequest(BaseModel):
    message: str = Field(
        min_length=1,
        max_length=4000
    )

    conversation_id: UUID | None = None


class AssistantChatResponse(BaseModel):
    conversation_id: UUID
    user_message: str
    assistant_message: str


class AssistantMessageResponse(BaseModel):
    id: UUID
    role: str
    content: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class AssistantConversationResponse(BaseModel):
    id: UUID
    title: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)