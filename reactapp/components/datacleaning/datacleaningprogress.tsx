import { SetStateAction, useState} from 'react';
import { Button } from '@/components/ui/button';
import { Alert } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';

const DataCleaningProgress = () => {
    const [file, setFile] = useState<File | null>(null);
    const [progress, setProgress] = useState(0);
    const [message, setMessage] = useState('Upload your file to start');
    const [error, setError] = useState<string | null>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            setFile(e.target.files[0]);
        }
    };

    const uploadFile = async () => {
        if (!file) return;

        const formData = new FormData();
        formData.append('file', file);

        setMessage('Uploading file...');
        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/data_operation/data-cleaning`, {
                method: 'POST',
                body: formData,
                headers: {
                    Authorization: `Bearer ${localStorage.getItem('token')}`
                }
            });
            const data = await response.json(); // Parsez la réponse JSON
            const { id } = data; // Ajustez selon la réponse de votre backend

            setMessage('File uploaded. Cleaning started...');
            await checkProgress(id);
        } catch (error) {
            setError('Upload failed. Please try again.');
            console.error(error);
        }
    };

    const checkProgress = async (taskId: any) => {
        try {
            const intervalId = setInterval(async () => {
                const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/data_operation/data-cleaning/${taskId}/status`, {
                    headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
                });
                const data = await response.json(); // Parsez la réponse JSON
                const { message, output_file } = data;

                if (message.includes('completed')) {
                    setProgress(100);
                    setMessage('Cleaning completed successfully!');
                    clearInterval(intervalId);
                } else {
                    setProgress((prev) => Math.min(prev + 20, 90));
                    setMessage(message);
                }
            }, 2000);
        } catch (error) {
            setError('Progress check failed.');
            console.error(error);
        }
    };

    return (
        <div className="p-4 bg-gray-100 rounded-md shadow-lg max-w-md mx-auto mt-8">
            <h1 className="text-lg font-semibold mb-4">Data Cleaning Progress</h1>
            <input type="file" onChange={handleFileChange} className="mb-4 p-2 border rounded" />
            <Button onClick={uploadFile} disabled={!file}>Start Cleaning</Button>

            {error && <Alert className="mt-4 text-red-500">{error}</Alert>}
            <div className="mt-4">
                <Progress value={progress} max={100} className="h-4 bg-blue-500" />
                <p className="mt-2 text-gray-600">{message}</p>
            </div>
        </div>
    );
};

export default DataCleaningProgress;