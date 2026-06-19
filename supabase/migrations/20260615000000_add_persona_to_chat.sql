ALTER TABLE chat_messages ADD COLUMN persona text NOT NULL DEFAULT 'ryan';

CREATE INDEX chat_messages_persona_idx ON chat_messages(user_id, persona);
