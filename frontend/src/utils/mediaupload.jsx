const supabaseUrl = 'https://dcrstcyezgmwvarnwkol.supabase.co';
const key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRjcnN0Y3llemdtd3Zhcm53a29sIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc5NDY4MzAsImV4cCI6MjA4MzUyMjgzMH0.bTS39aVTZIW4jf-d04Cp55jfF8AAEu3E5LmwrjchNco";

import { createClient } from '@supabase/supabase-js';
const supabase = createClient(supabaseUrl, key);
export default function MediaUpload(file) {
    return new Promise((resolve, reject) => {
        if (!file) {
            reject("Please select a file first");
            return;
        }
        const timestamp = new Date().getTime();
        const fileName = `${timestamp}-${file.name}`;
        supabase.storage.from('key').upload(fileName, file, { cacheControl: '3600', upsert: false })
            .then((response) => {
                if (response.error) {
                    reject("Error uploading file: " + response.error.message);
                } else {
                    const publicUrl = supabase.storage.from('key').getPublicUrl(fileName).data.publicUrl;
                    resolve(publicUrl);
                }
            })
            .catch((error) => {
                reject("Error uploading file: " + error.message);
            });
    });
}