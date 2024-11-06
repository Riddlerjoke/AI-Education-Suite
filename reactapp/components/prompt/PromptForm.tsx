import React, { useRef, useState } from 'react';
import { useForm, SubmitHandler } from 'react-hook-form';
import * as z from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Form, FormControl, FormField, FormItem } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Loader } from '@/components/format/loader';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Paperclip } from 'lucide-react';
import { Label } from "@/components/ui/label";
import Image from 'next/image';

const formSchema = z.object({
  user_prompt: z.string().nonempty('Le prompt ne peut pas être vide'),
  file: z.any().optional(),
});

type FormSchemaType = z.infer<typeof formSchema>;

interface PromptFormProps {
  onMessageReceived: (userMessage: Message, apiResponseMessage: Message) => void;
  selectedModel: string | null;
  onModelChange: (model: string | null) => void;
  pageName: string;
}

interface Message {
  role: string;
  content: string;
}

const PromptForm: React.FC<PromptFormProps> = ({ onMessageReceived, selectedModel, onModelChange, pageName }) => {
  const form = useForm<FormSchemaType>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      user_prompt: '',
      file: undefined,
    },
  });

  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const isLoading = form.formState.isSubmitting;
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const onSubmit: SubmitHandler<FormSchemaType> = async (values) => {
    try {
      const userMessage: Message = {
        role: 'user',
        content: values.user_prompt,
      };
  
      if (!selectedModel) {
        throw new Error('Veuillez sélectionner un modèle.');
      }
      const apiUrl = `${process.env.NEXT_PUBLIC_API_BASE_URL}/prompts/create_prompt/${selectedModel}?page=${pageName}`;
  
      const formData = new FormData();
      formData.append('user_prompt', values.user_prompt);
      if (values.file && values.file.length > 0) {
        formData.append('file', values.file[0]);
      }
  
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: formData,
      });
  
      if (!response.ok) {
        throw new Error(`Erreur HTTP: ${response.status}`);
      }
  
      const data = await response.json();
  
      if (data && data.generated_response) {
        const apiResponseMessage: Message = {
          role: 'api',
          content: data.generated_response,
        };
  
        // Notifie le parent pour gérer le message utilisateur et la réponse API
        onMessageReceived(userMessage, apiResponseMessage);
      } else {
        console.error('generate_content absent dans la réponse', data);
      }
  
      // Réinitialisation du formulaire après l'envoi
      form.reset({
        user_prompt: '',
        file: undefined,
      });
      setSelectedImage(null);
    } catch (error) {
      console.error('Erreur lors de la requête', error);
    }
  };
  

  const handleFileButtonClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedImage(URL.createObjectURL(file));
      form.setValue('file', e.target.files);
    }
  };

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="rounded-lg border w-full p-2 px-2 md:px-2 bg-gray-300 focus-within:shadow-sm grid grid-cols-3 md:grid-cols-12 gap-2"
      >
        <div className="lg:col-span-10 flex items-center space-x-2 md:col-span-8">
          <FormField
            name="file"
            render={({ field }) => (
              <FormItem className="flex items-center">
                <div className="text-black">
                  <Input
                    id="picture"
                    type="file"
                    ref={fileInputRef}
                    style={{ display: 'none' }}
                    onChange={handleFileChange}
                  />
                  <Button
                    type="button"
                    onClick={handleFileButtonClick}
                    disabled={isLoading}
                    className="p-2 bg-transparent hover:bg-transparent"
                  >
                    {selectedImage ? (
                      <Image src={selectedImage} alt="Selected file" width={25} height={25} className="rounded" />
                    ) : (
                      <Paperclip className="w-5 h-5" />
                    )}
                  </Button>
                </div>
              </FormItem>
            )}
          />
          <FormField
            name="user_prompt"
            render={({ field }) => (
              <FormItem className="flex-1">
                <FormControl className="m-0 p-0 text-black font-bold">
                  <Input
                    className="border-0 outline-none p-2 w-full transition-colors duration-200 ease-in-out"
                    disabled={isLoading}
                    placeholder="ex : je voudrais connaitre la circonference du soleil ?"
                    {...field}
                  />
                </FormControl>
              </FormItem>
            )}
          />
        </div>
        <div className="col-span-2 flex items-center space-x-2">
          <FormItem>
            <Select onValueChange={onModelChange} value={selectedModel ?? undefined} disabled={isLoading}>
              <SelectTrigger className="w-full dark:bg-[#111827]">
                <SelectValue placeholder="model"/>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="gpt">gpt</SelectItem>
                <SelectItem value="gemini">Gemini</SelectItem>
                <SelectItem value="mistral">Mistral</SelectItem>
              </SelectContent>
            </Select>
          </FormItem>
          <Button type="submit" className="w-full h-full md:w-full lg:w-full xl:w-full bg-primary hover:bg-primary/90 transition-colors duration-200 ease-in-out" disabled={isLoading}>
            {isLoading ? <Loader /> : "Generate"}
          </Button>
        </div>
      </form>
    </Form>
  );
};

export default PromptForm;