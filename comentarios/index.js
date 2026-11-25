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
    serieId: req.params.id,
    status: 'pendente'
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

// I: PUT /series/:id/comentarios/:idComentario, que edita o texto de um comentário
app.put('/series/:id/comentarios/:idComentario', async (req, res) => {
  const { texto } = req.body || {}
  const comentariosDaSerie = comentariosPorSerieId[req.params.id] || []
  const comentario = comentariosDaSerie.find(c => c.id === req.params.idComentario)

  if (!comentario) {
    return res.status(404).json({ erro: 'comentário não encontrado' })
  }

  // troca o texto e volta para a fila de moderação
  comentario.texto = texto
  comentario.status = 'pendente'

  // avisa o barramento que o comentário foi editado
  await axios.post('http://localhost:10000/eventos', {
    tipo: 'ComentarioEditado',
    dados: comentario
  })

  res.status(200).json(comentario)
})

// H: mapa de funções: para cada tipo de evento, o que fazer com os dados
const funcoes = {
  ComentarioModerado: async (comentarioModerado) => {
    // localiza o comentário pelo serieId e pelo id
    const comentarios = comentariosPorSerieId[comentarioModerado.serieId] || []
    const comentario = comentarios.find(c => c.id === comentarioModerado.id)
    if (!comentario) return
    // atualiza o status
    comentario.status = comentarioModerado.status
    // avisa o restante do sistema com o evento genérico
    try {
      await axios.post('http://localhost:10000/eventos', {
        tipo: 'ComentarioAtualizado',
        dados: {
          id: comentario.id,
          texto: comentario.texto,
          serieId: comentario.serieId,
          status: comentario.status
        }
      })
    } catch (e) {}
  }
}

// G: POST /eventos, que recebe os eventos repassados pelo barramento
app.post('/eventos', (req, res) => {
  const evento = req.body
  console.log(evento.tipo)
  try {
    funcoes[evento.tipo](evento.dados)
  } catch (e) {}
  res.end()
})

// E: coloca o servidor no ar na porta 4100
const port = 4100
app.listen(port, () => console.log(`Comentários. Porta ${port}.`))