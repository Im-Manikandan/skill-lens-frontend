
import React from 'react';
import { Outlet } from 'react-router';
import SkillLensChatbot from '../components/chatbot/SkillLensChatbot';

const ClientChatbotLayout = () => {
  return (
    <>
      <Outlet />
      <SkillLensChatbot />
    </>
  );
};

export default ClientChatbotLayout;
