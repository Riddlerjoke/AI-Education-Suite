"use client";

import React, { useState, useEffect, useRef } from 'react';
import { Heading } from '@/components/format/heading';
import { MessageSquare } from 'lucide-react';
import Navbar from '@/components/navbar/navbar';
import PromptForm from '@/components/prompt/PromptForm';
import { Empty } from '@/components/format/empty';
import { useUser } from '@/components/user/UserContext';
import withAuth from 'src/hocs/withauth';
import { Message } from '@/types';
import FormatedPrompts from "@/components/prompt/FormatedPrompts";
import useFetchModels from '@/src/hooks/fetchModels';

const ConversationPage = () => {
  const { user, fetchUserData } = useUser();
  const [hasFetched, setHasFetched] = useState(false);
  const [shouldFetch, setShouldFetch] = useState(false);
  const [selectedModel, setSelectedModel] = useState<string | null>("gpt");
  const { messages: fetchedMessages, loading, error } = useFetchModels(user, shouldFetch, selectedModel, 'conversation');
  const [messages, setMessages] = useState<Message[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!user) {
      fetchUserData();
    }
  }, [user, fetchUserData]);

  useEffect(() => {
    if (user && !hasFetched) {
      setShouldFetch(true);
      setHasFetched(true);
    }
  }, [user, hasFetched]);

  useEffect(() => {
    if (fetchedMessages.length >= 1) {
      setMessages(fetchedMessages);
      setShouldFetch(false);
    }
  }, [fetchedMessages]);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "instant" });
    }
  }, [messages]);
  
  useEffect(() => {
    if (shouldFetch && selectedModel) {
      // Effectue la requête pour récupérer les messages pour le modèle sélectionné
      setShouldFetch(true)
      setShouldFetch(false);  // On arrête de déclencher le fetch après la récupération
    }
  }, [shouldFetch, selectedModel]);

  const handleMessagesReceived = (userMessage: Message, apiResponseMessage: Message) => {
    setShouldFetch(true); // Ceci relancera le fetch des messages depuis l'API
  };
  

  const handleModelChange = (model: string | null) => {
    setSelectedModel(model);
    setMessages([]); 
    setShouldFetch(true);
  };

  if (loading) return null;
  if (error) return <div>Error: {error}</div>;

  return (
    <div className="flex flex-col h-screen">
      <Navbar />
      <div className="flex-grow h-full overflow-auto">
        <Heading
          title="Conversation"
          description="Assistant conversationnel pour la formation à l'IA !"
          icon={MessageSquare}
          iconColor="text-violet-500"
          bgColor="bg-violet-500/10"
        />
        <div>
          {messages.length === 0 && (
            <Empty label="no conversation started" />
          )}
          <FormatedPrompts messages={messages}/>
          <div ref={messagesEndRef} />
        </div>
      </div>
      <div className="p-4 lg:p-8 bg-transparent">
        <PromptForm
          onMessageReceived={handleMessagesReceived}
          selectedModel={selectedModel}
          onModelChange={handleModelChange}
          pageName="conversation"
        />
      </div>
    </div>
  );
};

export default withAuth(ConversationPage);
