"use client";

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import withAuth from '@/src/hocs/withauth';
import Navbar from '@/components/navbar/navbar';
import { Avatar } from '@/components/ui/avatar';
import { AvatarFallback } from '@/components/ui/avatar';
import { Card } from '@/components/ui/Card';
import { Heading } from '@/components/format/heading';
import DataCleaningProgress from '@/components/datacleaning/datacleaningprogress'; // Adjust path as necessary
import { useUser } from '@/components/user/UserContext';
import {ServerCog} from "lucide-react";
import NotebookComponent from '@/components/datacleaning/notebookcomponent'; // Adjust path as necessary

const MLToolsPageContent = () => {
  const router = useRouter();
  const { user, setUser } = useUser();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const token = localStorage.getItem('token');

        if (!token) {
          router.push('/settings');
          return;
        }

        const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/users/users/me`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          throw new Error(`HTTP Error: ${response.status}`);
        }

        const userData = await response.json();
        setUser(userData);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching user data', error);
        router.push('/sign-in');
      }
    };

    fetchUserData();
  }, [setUser, router]);

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
      <div>
      <Navbar />
      <Heading
           title="Machine Learning Tools"
          description="bien débuter avec le machine learning !"
           icon={ServerCog}
           iconColor="text-green-500"
           bgColor="bg-green-500/10"
         />

    <div className="settings-page px-4 md:px-20 lg:px-32 dark:bg-[#111827] space-y-6">

      <h1 className="text-4xl font-semibold border-b-2 p-2 border-black dark:border-white">ML Tools</h1>

      <Card className="text-2xl font-semibold border-b-2 p-2 border-black dark:border-white">Data Cleaning Tool</Card>

        <Card className="text-2xl font-semibold border-b-2 p-4 border-black dark:border-white">
          <div className="mb-4">Data Cleaning Tool</div>
          <DataCleaningProgress />
        </Card>
        <Card className="p-4 border border-black dark:border-white mt-6">
            <h2 className="text-xl font-semibold mb-4">Interactive Notebook</h2>
            <NotebookComponent notebookUrl="/path/to/your/notebook.ipynb" />
        </Card>

      <div className="pb-20 bg-white dark:bg-[#111827]">
        <div className="flex items-center justify-center">
          <div>
            <h3 className="flex mt-72 justify-center dark:text-white text-lg font-semibold text-black">
              ManagIA
            </h3>
            <p className="text-sm font-semibold text-black dark:text-white">
              © 2021 ManagIA, Inc. All rights reserved.
            </p>
          </div>
        </div>
      </div>
    </div>
    </div>
  );
};

export default withAuth(MLToolsPageContent);


