
const axios = require('axios');
const fs = require('fs');
const FormData = require('form-data');
const path = require('path');

const API_URL = 'http://localhost:3001';
const TEST_EMAIL = `test${Date.now()}@example.com`;
const TEST_PASSWORD = 'password123';

async function runTest() {
    try {
        console.log('--- FamaServer E2E Test ---');

        // 1. Register
        console.log(`1. Registering user ${TEST_EMAIL}...`);
        await axios.post(`${API_URL}/auth/register`, {
            name: 'Test User',
            email: TEST_EMAIL,
            password: TEST_PASSWORD,
            confirmPassword: TEST_PASSWORD
        });
        console.log('✅ Registered.');

        // 2. Login
        console.log('2. Logging in...');
        const loginRes = await axios.post(`${API_URL}/auth/login`, {
            email: TEST_EMAIL,
            password: TEST_PASSWORD
        });
        const token = loginRes.data.access_token;
        console.log('✅ Logged in. Token obtained.');

        const api = axios.create({
            baseURL: API_URL,
            headers: { Authorization: `Bearer ${token}` }
        });

        // 3. Create Folder
        console.log('3. Creating folder "Docs"...');
        const folderRes = await api.post('/files/folder', { name: 'Docs' });
        const folderId = folderRes.data.id;
        console.log(`✅ Folder created. ID: ${folderId}`);

        // 4. Upload File
        console.log('4. Uploading test file...');
        const niceFile = path.join(__dirname, 'testfile.txt');
        fs.writeFileSync(niceFile, 'Hello FamaServer World!');
        
        const form = new FormData();
        form.append('file', fs.createReadStream(niceFile));
        form.append('parentId', folderId);

        const uploadRes = await api.post('/files/upload', form, {
            headers: { ...form.getHeaders() }
        });
        const fileId = uploadRes.data.id;
        console.log(`✅ File uploaded. ID: ${fileId}`);

        // 5. List Files
        console.log('5. Listing files in folder...');
        const listRes = await api.get('/files', { params: { folderId } });
        const files = listRes.data;
        if (files.length !== 1 || files[0].name !== 'testfile.txt') {
            throw new Error('Listing failed or file missing.');
        }
        console.log('✅ List correct.');

        // 6. Share Link
        console.log('6. Generating share link...');
        const shareRes = await api.post(`/files/share/${fileId}`);
        const shareToken = shareRes.data.token;
        console.log(`✅ Share token: ${shareToken}`);

        // 7. Access Public Share
        console.log('7. Accessing public share...');
        const publicRes = await axios.get(`${API_URL}/public/share/${shareToken}`);
        if (publicRes.data.file.name !== 'testfile.txt') {
             throw new Error('Public share access failed.');
        }
        console.log('✅ Public share verified.');

        // 8. Delete File
        console.log('8. Deleting file...');
        await api.delete(`/files/${fileId}`);
        console.log('✅ File deleted.');

        // 9. Verify Deletion
        const listRes2 = await api.get('/files', { params: { folderId } });
        if (listRes2.data.length !== 0) {
            throw new Error('File not deleted properly.');
        }
        console.log('✅ Deletion verified.');

        console.log('--- ALL TESTS PASSED ---');
        fs.unlinkSync(niceFile);

    } catch (error) {
        console.error('❌ Test Failed:', error.message);
        if (error.response) {
            console.error('Status:', error.response.status);
            console.error('Data:', JSON.stringify(error.response.data, null, 2));
        } else {
             console.error(error);
        }
        process.exit(1);
    }
}

runTest();
