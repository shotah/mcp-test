-- Enable the pgvector extension
create extension if not exists vector;

-- Create a table to store documents with embeddings
create table documents (
  id uuid default gen_random_uuid() primary key,
  title text not null,
  content text not null,
  embedding vector(1536), -- OpenAI ada-002 uses 1536 dimensions
  metadata jsonb default '{}',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create an index for vector similarity search
create index on documents using ivfflat (embedding vector_cosine_ops)
with (lists = 100);

-- Create a table to store chat sessions
create table chat_sessions (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade,
  title text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create a table to store chat messages
create table chat_messages (
  id uuid default gen_random_uuid() primary key,
  session_id uuid references chat_sessions(id) on delete cascade,
  role text not null check (role in ('user', 'assistant', 'system')),
  content text not null,
  metadata jsonb default '{}',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable Row Level Security
alter table documents enable row level security;
alter table chat_sessions enable row level security;
alter table chat_messages enable row level security;

-- Create policies for documents (users can only see their own documents)
create policy "Users can view their own documents" on documents
  for select using (auth.uid() = (metadata->>'user_id')::uuid);

create policy "Users can insert their own documents" on documents
  for insert with check (auth.uid() = (metadata->>'user_id')::uuid);

create policy "Users can update their own documents" on documents
  for update using (auth.uid() = (metadata->>'user_id')::uuid);

create policy "Users can delete their own documents" on documents
  for delete using (auth.uid() = (metadata->>'user_id')::uuid);

-- Create policies for chat sessions
create policy "Users can view their own chat sessions" on chat_sessions
  for select using (auth.uid() = user_id);

create policy "Users can insert their own chat sessions" on chat_sessions
  for insert with check (auth.uid() = user_id);

create policy "Users can update their own chat sessions" on chat_sessions
  for update using (auth.uid() = user_id);

create policy "Users can delete their own chat sessions" on chat_sessions
  for delete using (auth.uid() = user_id);

-- Create policies for chat messages
create policy "Users can view messages from their sessions" on chat_messages
  for select using (
    exists (
      select 1 from chat_sessions 
      where chat_sessions.id = chat_messages.session_id 
      and chat_sessions.user_id = auth.uid()
    )
  );

create policy "Users can insert messages to their sessions" on chat_messages
  for insert with check (
    exists (
      select 1 from chat_sessions 
      where chat_sessions.id = chat_messages.session_id 
      and chat_sessions.user_id = auth.uid()
    )
  );

-- Create a function to search for similar documents
create or replace function search_documents(
  query_embedding vector(1536),
  match_threshold float default 0.5,
  match_count int default 10
)
returns table (
  id uuid,
  title text,
  content text,
  similarity float
)
language sql stable
as $$
  select
    documents.id,
    documents.title,
    documents.content,
    1 - (documents.embedding <=> query_embedding) as similarity
  from documents
  where 1 - (documents.embedding <=> query_embedding) > match_threshold
  order by documents.embedding <=> query_embedding
  limit match_count;
$$;

-- Create a function to update the updated_at timestamp
create or replace function update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = timezone('utc'::text, now());
  return new;
end;
$$ language plpgsql;

-- Create triggers to automatically update the updated_at column
create trigger update_documents_updated_at
  before update on documents
  for each row execute function update_updated_at_column();

create trigger update_chat_sessions_updated_at
  before update on chat_sessions
  for each row execute function update_updated_at_column();
