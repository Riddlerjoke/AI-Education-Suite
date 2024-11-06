"use client";

import React, { useState, useEffect } from 'react';
import { Heading } from '@/components/format/heading';
import { Code } from 'lucide-react';
import Navbar from '@/components/navbar/navbar';
import PromptForm from '@/components/prompt/PromptForm';
import { Empty } from '@/components/format/empty';
import withAuth from 'src/hocs/withauth';
import { useUser } from '@/components/user/UserContext';
import { Message } from '@/types';
import FormatedPrompts from "@/components/prompt/FormatedPrompts";
import useFetchModels from "@/src/hooks/fetchModels";

const CodePage: React.FC = () => {
const { user, fetchUserData } = useUser();
  const [hasFetched, setHasFetched] = useState(false);
  const [shouldFetch, setShouldFetch] = useState(false);
  const [selectedModel, setSelectedModel] = useState<string | null>("gpt");
  const { messages: fetchedMessages, loading, error } = useFetchModels(user, shouldFetch, selectedModel, "codegenerator");
  const [messages, setMessages] = useState<Message[]>([]);

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
    if (fetchedMessages.length > 0) {
      setMessages(fetchedMessages.reverse());
      setShouldFetch(false);
    }
  }, [fetchedMessages]);

  const handleMessagesReceived = (userMessage: Message, apiResponseMessage: Message) => {
    setMessages((oldMessages) => [userMessage, apiResponseMessage, ...oldMessages]);
  };

  const handleModelChange = (model: string | null) => {
    setSelectedModel(model);
    setShouldFetch(true);
  };

  if (loading) return null;
  if (error) return <div>Error: {error}</div>;

  return (
    <div>
      <Navbar />
      <Heading
        title="Code Generator"
        description="Assistant pour générer du code à partir de texte !"
        icon={Code}
        iconColor="text-green-500"
        bgColor="bg-green-500/10"
      />
      <div className="px-4 lg:px-8 mt-10">
        <PromptForm onMessageReceived={handleMessagesReceived} selectedModel={selectedModel} onModelChange={handleModelChange} pageName = "codegenerator"/>
        <div className="space-y-4 mt-4">
          {messages.length === 0 && (
            <Empty label="no conversation started" />
          )}
          <FormatedPrompts messages={messages} />
        </div>
      </div>
    </div>
  );
};

export default withAuth(CodePage);
