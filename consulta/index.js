// A: importa o express e o axios, e cria a aplicação
const express = require('express')
const axios = require('axios')
const app = express()

// B: middleware que lê o corpo JSON
app.use(express.json())

// C: base da consulta: cada série com os seus comentários juntos
const baseConsulta = {}

// D: mapa de funções: para cada tipo de evento, o que fazer com os dados
const funcoes = {
  SerieCriada: (serie) => {
    baseConsulta[serie.id] = {
      id: serie.id,
      titulo: serie.titulo,
      plataforma: serie.plataforma,
      comentarios: []
    }
  },
  ComentarioCriado: (comentario) => {
    const serie = baseConsulta[comentario.serieId]
    serie.comentarios.push(comentario)
  },
  ComentarioAtualizado: (comentario) => {
    // troca o comentário inteiro, sem examinar o que mudou
    const comentarios = baseConsulta[comentario.serieId].comentarios
    const indice = comentarios.findIndex(c => c.id === comentario.id)
    comentarios[indice] = comentario
  }
}

// edição também troca o comentário inteiro
funcoes.ComentarioEditado = funcoes.ComentarioAtualizado

// E: GET /series, que devolve a base inteira
app.get('/series', (req, res) => {
  res.json(baseConsulta)
})

// H: GET /series/:id, que devolve uma série com os seus comentários (ou 404)
app.get('/series/:id', (req, res) => {
  const serie = baseConsulta[req.params.id]
  if (!serie) {
    return res.status(404).json({ erro: 'série não encontrada' })
  }
  res.json(serie)
})

// F: POST /eventos, que executa a função do tipo do evento (ou ignora)
app.post('/eventos', (req, res) => {
  try {
    const evento = req.body
    funcoes[evento.tipo](evento.dados)
  } catch (e) {}
  res.end()
})

// G: coloca o servidor no ar e recupera os eventos que perdeu
const port = 4200
app.listen(port, async () => {
  console.log(`Consulta. Porta ${port}.`)
  try {
    const resp = await axios.get('http://localhost:10000/eventos')
    resp.data.forEach((evento) => {
      try {
        funcoes[evento.tipo](evento.dados)
      } catch (e) {}
    })
  } catch (e) {
    console.log('Barramento indisponível')
  }
})