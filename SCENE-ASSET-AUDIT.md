# B.3.1 — Auditoria dos assets 3D

## Estado da entrega

Consulta realizada em 2026-09-09. O usuário forneceu `hogwarts-3d.zip`, contendo o modelo Blender “Hogwarts 3D”, de Ju Designer. A página original declara CC BY 4.0. A prévia estática foi integrada, exclusivamente por `?scene=3d`, e continua pendente de aprovação visual.

O fundo padrão permanece disponível. A prévia usa React Three Fiber 9.7.0 e Three.js 0.186.0, com WebGPURenderer e alternativa WebGL 2. O modelo é uma réplica reconhecível; não deve ser descrito como arquitetura original ou paisagem cinematográfica concluída. A base retangular e a ausência de montanhas/margens ainda exigem revisão de composição.

## Arquivo selecionado e preparação

- Fonte e atribuição completa: `public/scenes/castle/ATTRIBUTION.md`.
- ZIP original: 60.073.881 bytes; 197 objetos mesh, 24 materiais, oito imagens; 969.772 triângulos após modificadores. Inspeção com Blender 4.5.9, `--factory-startup --disable-autoexec`; nenhum script embutido ou driver de objeto encontrado.
- As imagens de materiais do original são Textures.com. Foram removidas integralmente e substituídas por Diffuse/Normal 1K dos materiais CC0 Medieval Blocks 03 e Rocky Terrain, da Poly Haven. Não redistribuir o ZIP ou Blend original.
- Preparação Blender: substituir todos os materiais que usam imagens, remover câmeras/luzes e imagens originais, limitar subdivisão a 1, exportar apenas malhas com modificadores aplicados, sem animações. Manter o original privado para futura articulação de janelas.
- Otimização: `node tooling/scene-assets/optimize-castle.mjs work/hogwarts-prepared/castle.glb public/scenes/castle/castle.glb work/scene-tools/ktx/bin/toktx.exe`. Usa glTF Transform 4.5.0, Meshoptimizer 1.2.0 e KTX Software 4.4.2 oficial; UASTC com mipmaps e cores sRGB/normais lineares.
- Resultado: 188.530 triângulos, 7.164.256 bytes, GLB autocontido com Meshopt/KTX2. O tamanho de download não equivale à memória de GPU.
- A aparência não cria novas preferências nesta prova estática. Qualidade adaptativa, ciclo solar 3D e `dayforge:scene:v1` pertencem à B.3.2.

## Verificação da fundação

- Chrome local em perfil isolado: dez testes Playwright aprovados, incluindo 1440×900, 1024×768 e 390×844, dia/noite, WebGPU real e WebGL 2 forçado, ausência de overflow/erros nos fluxos normais, fallback de asset/GPU, navegação sem recarregar o modelo e movimento reduzido.
- Capturas em `outputs/scene-browser/` (ignoradas no Git), incluindo a geometria isolada à noite. Renderização sob demanda: contagem de quadros estável no intervalo ocioso de um segundo. Isso não comprova 60 fps para o futuro ambiente animado.
- Medição inicial em desenvolvimento, Chrome/Windows desta máquina: primeiro quadro a 4.061 ms em WebGPU 1440×900 e 2.417 ms em 1024×768; inclui inicialização da página. Não extrapolar para outros dispositivos. Memória de GPU não medida.
- Lint aprovado; build e 16 testes Node aprovados. O build avisa sobre chunk gráfico acima de 500 kB, carregado somente na prévia. O helper Sites falhou ao localizar npm no Windows; validação feita pelo `npm.cmd test`, que executa o build real.
- Typecheck isolado encontra três erros de tipos Cloudflare em `db/index.ts` e `worker/index.ts`, fora da mudança frontend. Auditoria npm: 23 alertas (1 baixo, 6 moderados, 16 altos); atualização global de ferramentas não foi misturada a esta entrega.

## Inventário

| Candidato e fonte original | Evidência consultada | Adequação e pendência |
| --- | --- | --- |
| [Modular Fort 01 — Rico Cilliers / Poly Haven](https://polyhaven.com/a/modular_fort_01) | Página declara CC0, formatos Blend/glTF e aproximadamente 28 mil triângulos. | Componentes de pedra úteis, mas a arquitetura colonial não equivale ao castelo gótico solicitado. Não aprovado como substituto do castelo. |
| [Coast Rocks 01 — Poly Haven](https://polyhaven.com/a/coast_rocks_01) | Catálogo descreve rochas costeiras com geometria e materiais realistas. A biblioteca publica seus assets sob CC0. | Candidato para margens; precisa de inspeção de escala, texturas, orçamento gráfico e arquivo de licença antes de incorporar. Não resolve o castelo. |
| [castle landscape — 3dfiles / BlendSwap](https://blendswap.com/blend/31236) | Página original declara CC-BY e cena Blender/Cycles de 815 MB. A descrição menciona modelagem/texturização no Blender 3.6. | Candidato a inspeção, não aprovado. Cena de render offline exigirá análise e otimização para web. Versão exata da licença e dependências dos materiais ainda não verificadas. |
| [Gothic Castle — TGW-Design / Sketchfab](https://sketchfab.com/3d-models/gothic-castle-e9b1f2e785f14833a774857814b9c45c) | Resultado indexado da página anuncia download gratuito e CC Attribution. A abertura da página retornou HTTP 403 nesta consulta. | Candidato pendente: não foi possível conferir a página integral, baixar o arquivo ou avaliar a composição. O resultado de busca não basta para aprovação de redistribuição. |
| [Hogwarts castle — jvasishta2013 / Sketchfab](https://sketchfab.com/3d-models/hogwarts-castle-41647c3521d94ebc968a72e547af0e6b) | Resultado indexado anuncia download; abertura da página retornou HTTP 403. | Não selecionado: licença/proveniência não verificadas e réplica do assunto fictício, em vez de composição original validada. |
| [Simple Castle — OpenGameArt](https://opengameart.org/content/simple-castle) | Página anuncia arquivo Blender e CC0. | Alternativa de estudo técnico; não aprovada para substituir a direção cinematográfica por um castelo simplificado. |

Licenças e acesso:

- [Poly Haven — licença](https://polyhaven.com/license): permite reutilização dos assets CC0, inclusive comercial. Guardar a proveniência mesmo quando atribuição não for obrigatória.
- [BlendSwap — documentação da API](https://blendswap.com/3d-mcp-api/docs): acesso por chave de conta; downloads podem consumir créditos depois da franquia gratuita. Nenhuma conta, chave ou crédito foi usado. Não colocar credenciais no repositório.
- Gratuidade de download não prova autorização de redistribuição. Não usar espelhos de origem incerta nem assets extraídos de jogos.

## Revisão necessária antes da próxima entrega

Avaliar o modelo fornecido, seus materiais substitutos e o enquadramento no dashboard. O plano de fundo ainda contém apenas castelo/base, iluminação estática e um plano de água para referência; não há ambiente animado concluído.

O fornecimento autorizou inspeção e adaptação; não tornou a qualidade visual automaticamente aprovada. A necessidade de modelar margens e montanhas deve ser resolvida na revisão da composição antes de prosseguir.

Não avançar para B.3.2 ou B.3.3 sem autorização e integração da entrega anterior.

## Procedimento de aceite do arquivo

1. Registrar autor, URL, licença exata, permissões de redistribuição/adaptação e atribuição requerida; verificar texturas e outros arquivos incluídos separadamente.
2. Inspecionar fontes Blender com execução automática de scripts desativada. Trabalhar em cópia e preservar o original fora dos assets públicos.
3. Conferir materiais, UVs, escala, normais e geometria; inventariar triângulos, materiais, texturas e tamanho dos arquivos. Registrar checksum do original.
4. Preparar GLB com otimização Meshopt e texturas KTX2; medir novamente. Não publicar a cena Blender offline de centenas de MB como asset de runtime.
5. Montar a prova estática diurna/noturna em React Three Fiber 9 e Three.js WebGPURenderer, com imagem de fallback, carregamento no cliente e câmera fixa.
6. Verificar WebGPU e WebGL 2 forçado; registrar separadamente backend real, dispositivo, tempo de carregamento, memória quando disponível e custo de renderização. Não inferir desempenho WebGPU de um teste WebGL.
7. Apresentar capturas em 1440×900, 1024×768 e 390×844, confirmar console, SSR e navegação, executar lint/build/testes e solicitar aprovação visual antes da próxima entrega.

## Limites preservados

- Nenhuma mudança em planner, banco, Worker, APIs ou layout nesta auditoria.
- Preferências de aparência e payload `rotina-369:data:v1` intactos.
- Água dinâmica, nuvens, ciclo solar 3D e controles de qualidade pertencem à B.3.2; criaturas e janelas animadas pertencem à B.3.3.
- A prova técnica não representa aceite visual da B.3.1.
