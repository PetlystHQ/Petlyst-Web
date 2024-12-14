const express = require('express');
const bodyParser = require('body-parser');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(bodyParser.json());

let users = []; // Bu, kullanıcıları saklamak için basit bir dizi

// Kullanıcı kaydı
app.post('/api/register', async (req, res) => {
    const { userType, email, password } = req.body;

    // Kullanıcı zaten var mı kontrol et
    const existingUser = users.find(user => user.email === email);
    if (existingUser) {
        return res.status(400).json({ message: 'Kullanıcı zaten mevcut' });
    }

    // Şifreyi hashle
    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = { userType, email, password: hashedPassword };
    users.push(newUser);

    res.status(201).json({ message: 'Kullanıcı başarıyla kaydedildi' });
});

// Kullanıcı girişi
app.post('/api/login', async (req, res) => {
    const { email, password } = req.body;

    const user = users.find(user => user.email === email);
    if (!user) {
        return res.status(400).json({ message: 'Geçersiz e-posta veya şifre' });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
        return res.status(400).json({ message: 'Geçersiz e-posta veya şifre' });
    }

    // JWT oluştur
    const token = jwt.sign({ email: user.email }, 'secret_key', { expiresIn: '1h' });
    res.json({ token });
});

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});