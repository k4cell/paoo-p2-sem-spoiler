// A: importa express e axios, e cria a aplicação
const express = require('express')
const axios = require('axios')
const app = express()

// B: middleware que lê o corpo JSON
app.use(express.json())

// C: histórico de todos os eventos recebidos, na ordem de chegada 
const eventos = []

// D: POST /eventos, que guarda o evento e repassa a todos os microsserviços
app.post('/eventos', async (req, res) => {
  const evento = req.body
  eventos.push(evento)
  try {
    await axios.post('http://localhost:4000/eventos', evento)
  } catch (e) {}
  try {
    await axios.post('http://localhost:4100/eventos', evento)
  } catch (e) {}
  try {
    await axios.post('http://localhost:4200/eventos', evento)
  } catch (e) {}
  try {
    await axios.post('http://localhost:4300/eventos', evento)
  } catch (e) {}
  res.end()
})

// E: GET /eventos, que devolve o histórico inteiro 
app.get('/eventos', (req, res) => {
  res.json(eventos)
})

// F: coloca o barramento no ar na porta 10000
const port = 10000
app.listen(port, () => console.log(`Barramento. Porta ${port}.`))