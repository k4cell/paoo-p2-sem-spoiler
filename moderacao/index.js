// A: importa express e axios, e cria a aplicação
const express = require('express')
const axios = require('axios')
const app = express()

// B: middleware que lê o corpo JSON
app.use(express.json())

// C: palavras que denunciam um spoiler
const palavrasProibidas = ['morre', 'final', 'assassino', 'traidor']

// D: mapa de funções: para cada tipo de evento, o que fazer com os dados
const funcoes = {
  ComentarioCriado: async (comentario) => {
    // diferencia maiúsculas de minúsculas: compara o texto como foi escrito
    const temSpoiler = palavrasProibidas.some(palavra => comentario.texto.includes(palavra))
    const status = temSpoiler ? 'spoiler' : 'liberado'
    try {
      await axios.post('http://localhost:10000/eventos', {
        tipo: 'ComentarioModerado',
        dados: {
          id: comentario.id,
          texto: comentario.texto,
          serieId: comentario.serieId,
          status: status
        }
      })
    } catch (e) {}
  }
}

// E: POST /eventos, que executa a função do tipo do evento (ou ignora)
app.post('/eventos', (req, res) => {
  try {
    const evento = req.body
    funcoes[evento.tipo](evento.dados)
  } catch (e) {}
  res.end()
})

// F: coloca o servidor no ar na porta 4300
const port = 4300
app.listen(port, () => console.log(`Moderação. Porta ${port}.`))
