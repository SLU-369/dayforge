# B.3.1 — Auditoria dos assets 3D

## Estado da entrega

Consulta realizada em 2026-09-09. Inventário concluído para os candidatos abaixo; **prova visual ainda não implementada**. Nenhum destes arquivos foi baixado, incorporado ou aprovado visualmente. Os dados de catálogo não substituem a inspeção do arquivo original e das licenças incluídas.

O cenário atual permanece intacto. Não foram instaladas dependências 3D nem produzidas capturas ou medições de WebGPU/WebGL 2. A lacuna bloqueadora é o castelo: ainda não há um modelo disponível e validado que sustente a estética cinematográfica aprovada.

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

## Decisão necessária para retomar

Obter um arquivo candidato com texturas e licença para inspeção, ou aprovar a produção de um castelo original como trabalho de modelagem. A opção inicial recomendada é avaliar um modelo gratuito completo antes de decidir por compra ou produção sob medida.

O usuário pode fornecer o arquivo original de um candidato obtido pela conta dele, acompanhado da página de origem e licença. Não é necessário compartilhar senha ou chave de API. O fornecimento permite a avaliação; não torna a qualidade visual automaticamente aprovada.

Não instalar bibliotecas nem substituir o fundo por um castelo genérico apenas para contornar esta decisão. Não avançar para B.3.2 ou B.3.3.

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
- O inventário é uma entrega documental concluída, não a conclusão da B.3.1.
