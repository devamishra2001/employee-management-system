import os

from datetime import (
    datetime,
    timedelta,
    timezone
)

import jwt

from dotenv import load_dotenv

from pwdlib import PasswordHash


# ============================================================
# LOAD ENVIRONMENT VARIABLES
# ============================================================

load_dotenv()


# ============================================================
# SECURITY CONFIGURATION
# ============================================================

SECRET_KEY = os.getenv(
    "SECRET_KEY"
)


ALGORITHM = os.getenv(
    "ALGORITHM",
    "HS256"
)


ACCESS_TOKEN_EXPIRE_MINUTES = int(
    os.getenv(
        "ACCESS_TOKEN_EXPIRE_MINUTES",
        "480"
    )
)


# ============================================================
# VALIDATE SECRET
# ============================================================

if not SECRET_KEY:

    raise RuntimeError(
        "SECRET_KEY is not configured. "
        "Set SECRET_KEY in backend/.env locally "
        "or in the Render environment variables."
    )


# ============================================================
# PASSWORD HASHER
# ============================================================

password_hash = PasswordHash.recommended()


# ============================================================
# HASH PASSWORD
# ============================================================

def hash_password(
    password: str
):

    return password_hash.hash(
        password
    )


# ============================================================
# VERIFY PASSWORD
# ============================================================

def verify_password(
    plain_password: str,
    hashed_password: str
):

    try:

        return password_hash.verify(
            plain_password,
            hashed_password
        )

    except Exception:

        return False


# ============================================================
# CREATE ACCESS TOKEN
# ============================================================

def create_access_token(
    data: dict,
    expires_delta: timedelta | None = None
):

    to_encode = data.copy()


    if expires_delta:

        expire = (
            datetime.now(
                timezone.utc
            )
            +
            expires_delta
        )

    else:

        expire = (
            datetime.now(
                timezone.utc
            )
            +
            timedelta(
                minutes=
                    ACCESS_TOKEN_EXPIRE_MINUTES
            )
        )


    to_encode.update({
        "exp":
            expire
    })


    encoded_jwt = jwt.encode(
        to_encode,
        SECRET_KEY,
        algorithm=
            ALGORITHM
    )


    return encoded_jwt