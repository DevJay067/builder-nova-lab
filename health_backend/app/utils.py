import hashlib

def channel_id_from_email(email: str) -> int:
	return int(hashlib.sha256(email.encode()).hexdigest(), 16) % (10**8)