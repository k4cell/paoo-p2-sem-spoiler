// A: importa express e axios, e cria a aplicação
const express = require('express')
const axios = require('axios')
const app = express()

// B: middleware que lê o corpo JSON
app.use(express.json())

// C: POST /eventos, que recebe um evento e repassa a todos os microsserviços
app.post('/eventos', async (req, res) => {
  const evento = req.body
  try {
    await axios.post('http://localhost:4000/eventos', evento)
  } catch (e) {}
  try {
    await axios.post('http://localhost:4100/eventos', evento)
  } catch (e) {}
  res.end()
})

// D: coloca o barramento no ar na porta 10000
const port = 10000
app.listen(port, () => console.log(`Barramento. Porta ${port}.`))