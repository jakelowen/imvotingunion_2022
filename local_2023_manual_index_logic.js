const express = require('express');
const path = require('path');
const app = express();

const PORT = process.env.port || 8080

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'cp2023.html'));
});

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
