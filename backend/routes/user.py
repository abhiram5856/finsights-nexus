from fastapi import APIRouter, HTTPException, Depends, Request
from db import get_supabase
from services.auth import get_current_user
from models.user import UserProfile, UserProfileCreate
from typing import Optional

router = APIRouter()

@router.post("/profile", response_model=UserProfile)
def create_profile(profile: UserProfileCreate, user_id: str = Depends(get_current_user)):
    """
    Creates a user profile in the database.
    Ensures that the profile being created belongs to the authenticated user.
    """
    if profile.id != user_id:
        raise HTTPException(status_code=403, detail="Unauthorized to create profile for another user")
    
    supabase = get_supabase()
    if not supabase:
        raise HTTPException(status_code=500, detail="Database connection failed")
    
    # Check if profile already exists
    existing = supabase.table("users").select("*").eq("id", user_id).execute()
    if existing.data:
        return existing.data[0]
    
    data = {
        "id": profile.id,
        "name": profile.name,
        "email": profile.email
    }
    
    try:
        result = supabase.table("users").insert(data).execute()
        if not result.data:
            raise HTTPException(status_code=400, detail="Failed to create profile")
        return result.data[0]
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/profile", response_model=UserProfile)
def get_profile(user_id: str = Depends(get_current_user)):
    """
    Fetches the profile for the authenticated user.
    """
    supabase = get_supabase()
    if not supabase:
        raise HTTPException(status_code=500, detail="Database connection failed")
    
    result = supabase.table("users").select("*").eq("id", user_id).execute()
    if not result.data:
        raise HTTPException(status_code=404, detail="Profile not found")
    
    return result.data[0]
