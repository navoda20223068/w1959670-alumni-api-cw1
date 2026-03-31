# Database Schema

## users
- id (PK)
- university_email
- password_hash
- email_verified
- role

## profiles
- id (PK)
- user_id (FK → users.id)
- first_name
- last_name
- biography
- linkedin_url
- profile_image_path
- completion_status

## degrees / certifications / licences / professional_courses
- id (PK)
- user_id (FK)
- name fields + provider fields

## employment_history
- id (PK)
- user_id (FK)
- company_name
- job_title
- start_date
- end_date

## bids
- id (PK)
- user_id (FK)
- bid_date
- amount
- status

## appearance_history
- id (PK)
- user_id (FK)
- featured_date
- won_by_bid_id
- event_bonus_used

## api_clients
- id (PK)
- user_id (FK)
- client_name
- status

## api_keys
- id (PK)
- client_id (FK)
- key_hash
- scopes
- expires_at
- revoked_at

## api_usage_logs
- id (PK)
- api_key_id (FK)
- endpoint
- method
- ip_address
- used_at