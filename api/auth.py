import os
from datetime import datetime, timedelta
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from pydantic import BaseModel
from jose import JWTError, jwt
from google.oauth2 import id_token
from google.auth.transport import requests

# Config
JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY", "your-super-secret-jwt-key")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24 * 7  # 7 days
GOOGLE_CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID", "your-google-client-id") # Must be provided by frontend eventually

auth_router = APIRouter(prefix="/api/auth", tags=["auth"])
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/google")

class TokenRequest(BaseModel):
    token: str

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, JWT_SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def verify_google_token(token: str):
    try:
        # Verify the token against Google's public keys
        # We allow any client ID for now since it's just a demo, but in prod you must pass audience=GOOGLE_CLIENT_ID
        id_info = id_token.verify_oauth2_token(token, requests.Request())
        return id_info
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid Google token")
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Token verification failed: {str(e)}")

async def get_current_user(token: str = Depends(oauth2_scheme)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, JWT_SECRET_KEY, algorithms=[ALGORITHM])
        user_email: str = payload.get("sub")
        if user_email is None:
            raise credentials_exception
        # You could fetch full user info from DB here. For now, return the payload.
        return payload
    except JWTError:
        raise credentials_exception

@auth_router.post("/google")
def auth_google(request: TokenRequest):
    """
    Verifies a Google ID token from the frontend and returns a JWT access token.
    """
    id_info = verify_google_token(request.token)
    
    # Generate our own internal JWT
    user_email = id_info.get("email")
    user_name = id_info.get("name")
    user_picture = id_info.get("picture")
    
    access_token = create_access_token(
        data={"sub": user_email, "name": user_name, "picture": user_picture}
    )
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": {
            "email": user_email,
            "name": user_name,
            "picture": user_picture
        }
    }

@auth_router.get("/me")
def get_me(current_user: dict = Depends(get_current_user)):
    """
    Returns the currently authenticated user's profile based on the JWT.
    """
    return {"user": current_user}

@auth_router.post("/logout")
def logout():
    """
    Since JWTs are stateless, we just return success. 
    The frontend should delete the token on its end.
    """
    return {"status": "logged out"}
