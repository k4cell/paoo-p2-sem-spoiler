// A: importa o express e a função v4 do uuid, e cria a aplicação
const express = require('express')
const axios = require('axios')       
const { v4: uuidv4 } = require('uuid')
const app = express()

// B: middleware que lê o corpo JSON
app.use(express.json())

// C: base em memória: chave = id da série, valor = vetor de comentários
const comentariosPorSerieId = {}

// D: POST /series/:id/comentarios, que cadastra um comentário na série da URL
app.post('/series/:id/comentarios', async (req, res) => { 
  const idComentario = uuidv4()
  const { texto } = req.body || {}
  const comentario = {
    id: idComentario,
    texto: texto,
    serieId: req.params.id
  }
  const comentariosDaSerie = comentariosPorSerieId[req.params.id] || []
  comentariosDaSerie.push(comentario)
  comentariosPorSerieId[req.params.id] = comentariosDaSerie

  // avisa o barramento que um comentário foi criado   
  await axios.post('http://localhost:10000/eventos', {
    tipo: 'ComentarioCriado',
    dados: comentario
  })

  res.status(201).json(comentariosDaSerie)
})

// F: GET /series/:id/comentarios, que devolve os comentários da série da URL
app.get('/series/:id/comentarios', (req, res) => {
  res.json(comentariosPorSerieId[req.params.id] || [])
})

// G: POST /eventos, que recebe os eventos repassados pelo barramento
app.post('/eventos', (req, res) => {
  const evento = req.body
  console.log(evento.tipo)
  res.end()
})

// E: coloca o servidor no ar na porta 4100
const port = 4100
app.listen(port, () => console.log(`Comentários. Porta ${port}.`))