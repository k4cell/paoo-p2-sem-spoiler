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
      // diferencia maiúsculas de minúsculas: compara o texto como foi escrito
      const temSpoiler = palavrasProibidas.some(palavra => comentario.texto.includes(palavra))
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

// comentário editado é moderado do mesmo jeito que um comentário novo
funcoes.ComentarioEditado = funcoes.ComentarioCriado

// E: POST /eventos, que executa a função do tipo do evento (ou ignora)
app.post('/eventos', (req, res) => {
  try {
    const evento = req.body
    funcoes[evento.tipo](evento.dados)
  } catch (e) {}
  res.end()
})

// F: coloca o servidor no ar e modera os comentários que ficaram para trás
const port = 4300
app.listen(port, async () => {
  console.log(`Moderação. Porta ${port}.`)
  try {
    const resp = await axios.get('http://localhost:10000/eventos')

    // 1ª passagem: guarda o último evento de cada comentário
    const ultimoEvento = {}
    resp.data.forEach((evento) => {
      if (evento.tipo === 'ComentarioCriado' || evento.tipo === 'ComentarioEditado' || evento.tipo === 'ComentarioModerado') {
        ultimoEvento[evento.dados.id] = evento
      }
    })

    // 2ª passagem: modera só os comentários cujo último evento não é ComentarioModerado
    resp.data.forEach((evento) => {
      try {
        const ehOUltimo = ultimoEvento[evento.dados.id] === evento
        if (ehOUltimo && evento.tipo !== 'ComentarioModerado') {
          funcoes[evento.tipo](evento.dados)
        }
      } catch (e) {}
    })
  } catch (e) {
    console.log('Barramento indisponível')
  }
})