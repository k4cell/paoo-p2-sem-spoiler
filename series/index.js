const HOST = '192.168.15.87'

// A: importa o express e cria a aplicação (o servidor)
const express = require('express')
const axios = require('axios')  
const app = express()

// B: middleware que transforma o corpo JSON da requisição em objeto (req.body)
app.use(express.json())

// C: a "base de dados" em memória: um objeto indexado pelo id, e o contador de ids
const series = {}
let id = 1

// D: endpoint GET /series, que devolve a base inteira
app.get('/series', (req, res) => {
  res.json(series)
})

// F: endpoint POST /series, que cadastra uma série
app.post('/series', async (req, res) => {          
  const { titulo, plataforma } = req.body || {}

  // Parte 2: valida (se faltar algum campo, responde 400 e para aqui)
  if (!titulo || !plataforma) {
    return res.status(400).json({ erro: 'titulo e plataforma são obrigatórios' })
  }

  // Parte 3: monta, guarda e incrementa o id
  const serie = {
    id: id,
    titulo: titulo,
    plataforma: plataforma
  }
  series[id] = serie
  id++

  // Parte 4: avisa o barramento que uma série foi criada    
  await axios.post(`http://${HOST}:10000/eventos`, {
    tipo: 'SerieCriada',
    dados: serie
  })

  res.status(201).json(serie)
})

// G: POST /eventos, que recebe os eventos repassados pelo barramento
app.post('/eventos', (req, res) => {
  const evento = req.body
  console.log(evento.tipo)
  res.end()
})

// E: coloca o servidor no ar na porta 4000
const port = 4000
app.listen(port, () => console.log(`Séries. Porta ${port}.`))