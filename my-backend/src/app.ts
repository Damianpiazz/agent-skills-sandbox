import express from 'express'

const app = express()

app.use(express.json())

app.get('/', (req, res) => {
    res.json({ message: 'API Express + TS funcionando 🚀' })
})

const PORT = 3000

app.listen(PORT, () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}`)
})