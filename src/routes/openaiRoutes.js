const express = require('express');
const OpenAI = require("openai");
const router = express.Router();

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
});

/**
 * @swagger
 * tags:
 *   name: OpenAI
 *   description: OpenAI API를 이용한 문제 추천 및 채점 API
 */

/**
 * @swagger
 * /:
 *   post:
 *     summary: 문제 추천
 *     description: 입력한 카테고리에 따라 백준의 초급, 중급, 고급 문제를 추천합니다.
 *     tags: [OpenAI]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               category:
 *                 type: string
 *                 description: 문제 추천 카테고리
 *                 example: '그래프'
 *     responses:
 *       200:
 *         description: 추천된 문제 목록
 *         content:
 *           application/json:
 *             schema:
 *               type: string
 *               example: '초급: [1000 - A+B], 중급: [1001 - A-B], 고급: [1002 - A*C]'
 *       500:
 *         description: 서버 에러
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: '추천 시스템에서 오류가 발생했습니다.'
 */
router.post('/', async (req, res) => {
    const { category } = req.body;
    const response = await openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [
            { role: 'system', content: '너는 문제 추천 시스템이다.' },
            { role: 'user', content: `백준에서 ${category} 문제를 초급, 중급, 고급으로 나누어 문제 번호와 제목을 배열 형식으로 3개씩 제공해 주세요. 예: 초급: [번호 - 제목], 중급: [번호 - 제목], 고급: [번호 - 제목].` }
        ],
        max_tokens: 150
    });
    res.send(response.choices[0].message.content);
});

/**
 * @swagger
 * /grade:
 *   post:
 *     summary: 코드 채점
 *     description: 제공된 문제 제목, 언어, 코드로 문제의 정확성을 채점합니다.
 *     tags: [OpenAI]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               data:
 *                 type: object
 *                 properties:
 *                   problemTitle:
 *                     type: string
 *                     description: 채점할 문제의 제목
 *                     example: 'A+B 문제'
 *                   userLanguage:
 *                     type: string
 *                     description: 사용자가 작성한 코드의 언어
 *                     example: 'python'
 *                   userCode:
 *                     type: string
 *                     description: 사용자가 제출한 코드
 *                     example: 'print(sum(map(int, input().split())))'
 *     responses:
 *       200:
 *         description: 코드 채점 결과
 *         content:
 *           application/json:
 *             schema:
 *               type: boolean
 *               example: true
 *       500:
 *         description: 채점 중 오류 발생
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: '채점 중 오류가 발생했습니다.'
 */
router.post('/grade', async (req, res) => {
    const { problemTitle, userLanguage, userCode } = req.body.data;

    try {
        const response = await openai.chat.completions.create({
            model: 'gpt-3.5-turbo',
            messages: [
                { role: 'system', content: 'You are a grading assistant. Respond only with true or false based on the correctness of the code.' },
                { role: 'user', content: `코드를 검증해주세요. 문제: "${problemTitle}", 언어: "${userLanguage}", 코드: "${userCode}". 올바른 경우 "true", 그렇지 않은 경우 "false"만 반환하세요.` }
            ],
            max_tokens: 5
        });
        const answer = response.choices[0].message.content.trim().toLowerCase();
        const result = answer.startsWith('true') ? true : false;
        res.send(result);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: '채점 중 오류가 발생했습니다.' });
    }
});

module.exports = router;
