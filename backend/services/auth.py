import os
from fastapi import Request, HTTPException, Depends
from jose import jwt, JWTError
from db import get_supabase

# For development/demo purposes if no secret is set
DEFAULT_TEST_USER = "00000000-0000-0000-0000-000000000001"

def get_current_user(request: Request):
    """
    Dependency that enforces valid authentication and email verification via Supabase.
    """
    auth_header = request.headers.get("Authorization")
    if not auth_header or not auth_header.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing or invalid authentication token")
    
    token = auth_header.split(" ")[1]
    supabase = get_supabase()
    
    try:
        # Verify the token with Supabase directly
        # This is more robust than manual JWT decoding as it doesn't require a local secret
        response = supabase.auth.get_user(token)
        user = response.user
        
        if not user:
            raise HTTPException(status_code=401, detail="Invalid token")
            
        user_id = user.id
        # Check email verification in user metadata or confirmed_at
        email_verified = user.email_confirmed_at is not None
        
        if not email_verified:
            raise HTTPException(status_code=403, detail="Email not verified")
            
        return user_id
        
    except Exception as e:
        print(f"Auth Validation Error: {e}")
        raise HTTPException(status_code=401, detail="Could not validate credentials")

def get_user_id(request: Request):
    """
    Simplified helper that returns user_id if possible, otherwise a default.
    Used for components that don't strictly require auth (e.g., initial load).
    """
    try:
        return get_current_user(request)
    except HTTPException:
        return DEFAULT_TEST_USER
