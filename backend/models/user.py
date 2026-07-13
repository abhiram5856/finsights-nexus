from pydantic import BaseModel, EmailStr
from datetime import datetime
from typing import Optional

class UserProfileBase(BaseModel):
    name: str
    email: EmailStr

class UserProfileCreate(UserProfileBase):
    id: str # UUID from Supabase auth.users

class UserProfile(UserProfileBase):
    id: str
    created_at: datetime

    class Config:
        from_attributes = True
