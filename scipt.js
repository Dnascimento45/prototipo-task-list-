  // ======================================================================
    //  GERENCIAMENTO DE PROJETOS
    // ======================================================================

    // Dados iniciais para o projeto padrão
    const TAREFAS_INICIAIS = [
        { id: 1, tarefa: "Header Global (Botão Voltar + Ferramentas)", obs: "Index.html ainda não atualizado!", status: "Pendente", secaoId: 1 },
        { id: 2, tarefa: "Layout do Caderno (Tela 3)", obs: "HTML base criado, ajustar CSS flex.", status: "Pendente", secaoId: 1 },
        { id: 3, tarefa: "Lógica do Caderno (caderno.js)", obs: "Integração dos eventos do header.", status: "Pendente", secaoId: 1 },
        { id: 4, tarefa: "Ferramentas do Header", obs: "Adicionar classe modo-caderno no body.", status: "Pendente", secaoId: 1 },
        { id: 5, tarefa: "Vídeo para SVG em Loop", obs: "Substituir vídeo por SVG animado.", status: "Pendente", secaoId: 2 },
        { id: 6, tarefa: "Canvas Infinito (Pan & Zoom)", obs: "Implementar deslocamento e pan visual.", status: "Pendente", secaoId: 2 },
        { id: 12, tarefa: "Dashboard (Tela 1)", obs: "Grid 2x2, capas em SVG.", status: "Pronto", secaoId: null },
        { id: 13, tarefa: "Transição de Ida", obs: "Efeito zoom out.", status: "Pronto", secaoId: null }
    ];

    const SECOES_INICIAIS = [
        { id: 1, nome: "Módulo 1: Layout & Core" },
        { id: 2, nome: "Módulo 2: Interatividade & Canvas" }
    ];

    const ORDEM_SECOES_INICIAL = [0, 1, 2];

    // ---- Variáveis globais do projeto atual ----
    let tarefas = [];
    let secoes = [];
    let ordemSecoes = [];

    // ---- Estrutura de todos os projetos ----
    let projetos = {};          // { id: { nome, tarefas, secoes, ordemSecoes } }
    let projetoAtualId = null;   // string

    const STORAGE_KEY = 'tasklist_multiprojetos_v1';

    // ---- Funções de persistência ----
    function salvarProjetos() {
        const dados = {
            projetos: projetos,
            projetoAtualId: projetoAtualId
        };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(dados));
    }

    function carregarProjetos() {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (raw) {
            try {
                const dados = JSON.parse(raw);
                if (dados.projetos && typeof dados.projetos === 'object') {
                    projetos = dados.projetos;
                    projetoAtualId = dados.projetoAtualId || null;
                    if (projetoAtualId && !projetos[projetoAtualId]) {
                        projetoAtualId = null;
                    }
                    if (!projetoAtualId || Object.keys(projetos).length === 0) {
                        criarProjetoPadrao();
                    }
                    return;
                }
            } catch (e) {}
        }
        criarProjetoPadrao();
    }

    function criarProjetoPadrao() {
        const id = 'projeto_' + Date.now();
        projetos = {};
        projetos[id] = {
            nome: 'Meu Projeto',
            tarefas: JSON.parse(JSON.stringify(TAREFAS_INICIAIS)),
            secoes: JSON.parse(JSON.stringify(SECOES_INICIAIS)),
            ordemSecoes: [...ORDEM_SECOES_INICIAL]
        };
        projetoAtualId = id;
        salvarProjetos();
    }

    function carregarProjeto(id) {
        if (!id || !projetos[id]) {
            criarProjetoPadrao();
            id = projetoAtualId;
        }
        const proj = projetos[id];
        tarefas = proj.tarefas || [];
        secoes = proj.secoes || [];
        ordemSecoes = proj.ordemSecoes || [0];
        projetoAtualId = id;
        // Atualiza UI
        const nomeProjeto = proj.nome || 'Sem nome';
        const spanNome = document.getElementById('nome-projeto-atual');
        spanNome.textContent = nomeProjeto;
        document.title = nomeProjeto + ' - Task List';
        atualizarSelectSecoes();
        renderizar();
        renderizarAbas();
        salvarProjetos();
    }

    function salvarProjetoAtual() {
        if (!projetoAtualId || !projetos[projetoAtualId]) return;
        const proj = projetos[projetoAtualId];
        proj.tarefas = tarefas;
        proj.secoes = secoes;
        proj.ordemSecoes = ordemSecoes;
        salvarProjetos();
    }

    // ---- Funções de manipulação de projetos ----
    function criarNovoProjeto(nome) {
        if (!nome) nome = prompt('Nome do novo projeto:', 'Novo Projeto');
        if (!nome) return;
        const id = 'projeto_' + Date.now();
        projetos[id] = {
            nome: nome.trim(),
            tarefas: [],
            secoes: [],
            ordemSecoes: [0]
        };
        salvarProjetos();
        carregarProjeto(id);
    }

    // Função de renomear (agora sem prompt, apenas atualiza o nome)
    function renomearProjeto(id, novoNome) {
        if (!id || !projetos[id]) return;
        const nomeFinal = (novoNome || '').trim();
        if (!nomeFinal) {
            // Se ficar vazio, reverter para o nome anterior
            const span = document.getElementById('nome-projeto-atual');
            span.textContent = projetos[id].nome;
            return;
        }
        projetos[id].nome = nomeFinal;
        salvarProjetos();
        if (id === projetoAtualId) {
            document.getElementById('nome-projeto-atual').textContent = nomeFinal;
            document.title = nomeFinal + ' - Task List';
        }
        renderizarAbas(); // atualiza o nome nas abas
    }

    function excluirProjeto(id) {
        if (!id || !projetos[id]) return;
        const qtd = Object.keys(projetos).length;
        if (qtd <= 1) {
            alert('Não é possível excluir o único projeto. Crie outro primeiro.');
            return;
        }
        if (!confirm(`Excluir o projeto "${projetos[id].nome}"? Esta ação é irreversível.`)) return;
        delete projetos[id];
        if (id === projetoAtualId) {
            const ids = Object.keys(projetos);
            if (ids.length > 0) {
                carregarProjeto(ids[0]);
            } else {
                criarProjetoPadrao();
            }
        } else {
            salvarProjetos();
            renderizarAbas();
        }
    }

    // ---- Exportação / Importação ----
    function exportarProjetoAtual() {
        if (!projetoAtualId || !projetos[projetoAtualId]) return;
        const proj = projetos[projetoAtualId];
        const payload = {
            nome: proj.nome,
            tarefas: proj.tarefas,
            secoes: proj.secoes,
            ordemSecoes: proj.ordemSecoes
        };
        const json = JSON.stringify(payload, null, 2);
        const blob = new Blob([json], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${proj.nome || 'projeto'}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    function importarProjeto(event) {
        const arquivo = event.target.files[0];
        if (!arquivo) return;

        const reader = new FileReader();
        reader.onload = function(e) {
            try {
                const dados = JSON.parse(e.target.result);
                if (!dados.tarefas && !dados.secoes) {
                    if (Array.isArray(dados)) {
                        const nome = prompt('Nome do projeto importado:', 'Importado');
                        if (nome === null) return;
                        const id = 'projeto_' + Date.now();
                        projetos[id] = {
                            nome: nome.trim() || 'Importado',
                            tarefas: dados,
                            secoes: [],
                            ordemSecoes: [0]
                        };
                        salvarProjetos();
                        carregarProjeto(id);
                        alert('Projeto importado com sucesso!');
                        return;
                    }
                    alert('Formato de arquivo inválido.');
                    return;
                }

                const nome = prompt('Nome do projeto importado:', dados.nome || 'Importado');
                if (nome === null) return;
                const id = 'projeto_' + Date.now();
                projetos[id] = {
                    nome: nome.trim() || 'Importado',
                    tarefas: dados.tarefas || [],
                    secoes: dados.secoes || [],
                    ordemSecoes: dados.ordemSecoes || [0]
                };
                salvarProjetos();
                carregarProjeto(id);
                alert('Projeto importado com sucesso!');
            } catch (err) {
                alert('Erro ao ler o arquivo JSON: ' + err.message);
            }
        };
        reader.readAsText(arquivo);
        event.target.value = '';
    }

    // ---- Renderização das Abas ----
    function renderizarAbas() {
        const wrapper = document.getElementById('abas-wrapper');
        const botoes = wrapper.querySelectorAll('.aba-item');
        botoes.forEach(el => el.remove());

        const ids = Object.keys(projetos);
        ids.sort((a, b) => a.localeCompare(b));

        ids.forEach(id => {
            const proj = projetos[id];
            const div = document.createElement('div');
            div.className = 'aba-item' + (id === projetoAtualId ? ' ativo' : '');
            div.dataset.id = id;

            const spanNome = document.createElement('span');
            spanNome.className = 'nome-aba';
            spanNome.textContent = proj.nome;
            spanNome.contentEditable = true;
            spanNome.title = 'Clique para editar o nome';
            spanNome.addEventListener('blur', function(e) {
                const novo = this.textContent.trim();
                if (novo !== proj.nome) {
                    renomearProjeto(id, novo);
                } else {
                    // se não mudou, apenas restaura o texto original (caso tenha sido alterado sem querer)
                    this.textContent = proj.nome;
                }
            });
            spanNome.addEventListener('keydown', function(e) {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    this.blur();
                }
                if (e.key === 'Escape') {
                    this.textContent = proj.nome;
                    this.blur();
                }
            });
            // Impedir que clique no nome dispare a troca de projeto
            spanNome.addEventListener('click', function(e) {
                e.stopPropagation();
            });

            const btnEditar = document.createElement('button');
            btnEditar.className = 'btn-editar-aba';
            btnEditar.innerHTML = '✎';
            btnEditar.title = 'Renomear projeto (clique no nome)';
            btnEditar.addEventListener('click', function(e) {
                e.stopPropagation();
                // Foca no spanNome para edição
                spanNome.focus();
                // Seleciona todo o texto
                const range = document.createRange();
                range.selectNodeContents(spanNome);
                const sel = window.getSelection();
                sel.removeAllRanges();
                sel.addRange(range);
            });

            const btnFechar = document.createElement('button');
            btnFechar.className = 'btn-fechar-aba';
            btnFechar.innerHTML = '✕';
            btnFechar.title = 'Excluir projeto';
            btnFechar.addEventListener('click', function(e) {
                e.stopPropagation();
                excluirProjeto(id);
            });

            div.appendChild(spanNome);
            div.appendChild(btnEditar);
            div.appendChild(btnFechar);

            div.addEventListener('click', function(e) {
                if (e.target.closest('.btn-fechar-aba') || e.target.closest('.btn-editar-aba')) return;
                if (e.target.closest('.nome-aba')) return; // já tratado
                if (id !== projetoAtualId) {
                    salvarProjetoAtual();
                    carregarProjeto(id);
                }
            });

            wrapper.insertBefore(div, wrapper.querySelector('.btn-nova-aba'));
        });
    }

    // ---- Inicialização ----
    function inicializar() {
        carregarProjetos();
        if (projetoAtualId) {
            carregarProjeto(projetoAtualId);
        } else {
            criarProjetoPadrao();
            carregarProjeto(projetoAtualId);
        }
        renderizarAbas();

        // Evento para edição inline do nome no header
        const spanHeader = document.getElementById('nome-projeto-atual');
        spanHeader.addEventListener('blur', function() {
            const novo = this.textContent.trim();
            if (novo && novo !== projetos[projetoAtualId].nome) {
                renomearProjeto(projetoAtualId, novo);
            } else {
                // Reverte para o nome atual
                this.textContent = projetos[projetoAtualId].nome;
            }
        });
        spanHeader.addEventListener('keydown', function(e) {
            if (e.key === 'Enter') {
                e.preventDefault();
                this.blur();
            }
            if (e.key === 'Escape') {
                this.textContent = projetos[projetoAtualId].nome;
                this.blur();
            }
        });

        document.getElementById('btnNovaAba').addEventListener('click', function() {
            const nome = prompt('Nome do novo projeto:', 'Novo Projeto');
            if (nome) criarNovoProjeto(nome);
        });

        inicializarArrastoMotorizado();
    }

    // ======================================================================
    //  FUNÇÕES HERDADAS
    // ======================================================================

    function atualizarSelectSecoes() {
        const select = document.getElementById("select-secao-add");
        const valorAtual = select.value;
        select.innerHTML = `<option value="0">📌 Geral / Sem Divisória</option>`;
        secoes.forEach(s => {
            select.innerHTML += `<option value="${s.id}"> ${s.nome}</option>`;
        });
        select.value = valorAtual || "0";
    }

    function alternarPainelDivisoria(forcarEstado = null) {
        const painel = document.getElementById("painel-divisoria");
        const input = document.getElementById("input-nome-divisoria");
        const visivel = forcarEstado !== null ? forcarEstado : painel.style.display !== "block";
        if (visivel) {
            painel.style.display = "block";
            input.value = "";
            input.focus();
        } else {
            painel.style.display = "none";
            input.value = "";
        }
    }

    function tratarTeclasDivisoria(e) {
        if (e.key === 'Enter') {
            confirmarCriarDivisoria();
        } else if (e.key === 'Escape') {
            alternarPainelDivisoria(false);
        }
    }

    function confirmarCriarDivisoria() {
        const input = document.getElementById("input-nome-divisoria");
        const nome = input.value.trim();
        if (!nome) {
            input.focus();
            return;
        }
        const maiorId = secoes.reduce((max, s) => s.id > max ? s.id : max, 0);
        const novaSecao = { id: maiorId + 1, nome: nome };
        secoes.push(novaSecao);
        if (!ordemSecoes.includes(novaSecao.id)) {
            ordemSecoes.push(novaSecao.id);
        }
        salvarProjetoAtual();
        alternarPainelDivisoria(false);
        renderizar();
        const selectSecao = document.getElementById("select-secao-add");
        selectSecao.value = novaSecao.id;
    }

    function renomearSecao(id, novoNome) {
        const idx = secoes.findIndex(s => s.id === id);
        if (idx !== -1) {
            secoes[idx].nome = novoNome.trim();
            salvarProjetoAtual();
            renderizar();
        }
    }

    function apagarSecao(id) {
        if (confirm("Apagar esta divisória? As tarefas dessa área serão movidas para a Seção Geral.")) {
            secoes = secoes.filter(s => s.id !== id);
            ordemSecoes = ordemSecoes.filter(sId => sId !== id);
            tarefas = tarefas.map(t => t.secaoId === id ? { ...t, secaoId: null } : t);
            salvarProjetoAtual();
            renderizar();
        }
    }

    function adicionarTarefa() {
        const inputTitulo = document.getElementById("input-titulo");
        const inputObs = document.getElementById("input-obs");
        const selectSecao = document.getElementById("select-secao-add");
        const titulo = inputTitulo.value.trim();
        const obs = inputObs.value.trim();
        const secaoId = Number(selectSecao.value) || null;

        if (!titulo) {
            inputTitulo.focus();
            return;
        }

        const maiorId = tarefas.reduce((max, t) => t.id > max ? t.id : max, 0);
        const novaTarefa = {
            id: maiorId + 1,
            tarefa: titulo,
            obs: obs || "Nota adicionada manualmente.",
            status: "Pendente",
            secaoId: secaoId
        };

        tarefas.unshift(novaTarefa);
        salvarProjetoAtual();

        inputTitulo.value = "";
        inputObs.value = "";
        inputTitulo.focus();

        renderizar();
    }

    function alternarStatus(id) {
        tarefas = tarefas.map(t => {
            if (t.id === id) t.status = t.status === "Pendente" ? "Pronto" : "Pendente";
            return t;
        });
        salvarProjetoAtual();
        renderizar();
    }

    function apagarTarefa(id) {
        if (confirm("Deseja apagar esta tarefa?")) {
            tarefas = tarefas.filter(t => t.id !== id);
            salvarProjetoAtual();
            renderizar();
        }
    }

    function atualizarTexto(id, campo, novoValor) {
        tarefas = tarefas.map(t => {
            if (t.id === id) t[campo] = novoValor.trim();
            return t;
        });
        salvarProjetoAtual();
    }

    function criarHeaderSecaoPendente(secaoId, nomeSecao) {
        const wrapper = document.createElement("div");
        wrapper.className = "secao-header-wrapper";
        wrapper.dataset.secaoId = secaoId;

        const handle = document.createElement("div");
        handle.className = "drag-handle-secao";
        handle.title = "Arraste para reordenar esta divisória";
        handle.innerHTML = `
            <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
                <path d="M5 3a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0zm0 5a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0zm-1.5 6.5a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3zM12.5 4.5a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3zm0 5a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3zm0 5a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3z"/>
            </svg>
        `;

        const li = document.createElement("li");
        li.className = "secao-header-item";
        li.dataset.secaoId = secaoId;

        if (secaoId === 0) {
            li.innerHTML = `<span>📌 ${nomeSecao}</span>`;
        } else {
            li.innerHTML = `
                <span> <span class="secao-titulo" contenteditable="true" onblur="renomearSecao(${secaoId}, this.textContent)">${nomeSecao}</span></span>
                <button class="btn-apagar-secao" onclick="apagarSecao(${secaoId})" title="Excluir Divisória">✕ Remover</button>
            `;
        }

        wrapper.appendChild(handle);
        wrapper.appendChild(li);
        return wrapper;
    }

    function renderizar() {
        atualizarSelectSecoes();

        const listaConcluidas = document.getElementById("lista-concluidas");
        const listaPendentes = document.getElementById("lista-pendentes");
        
        listaConcluidas.innerHTML = "";
        listaPendentes.innerHTML = "";

        const concluidas = tarefas.filter(t => t.status === "Pronto");
        const pendentes = tarefas.filter(t => t.status === "Pendente");

        document.getElementById("contador-concluidas").textContent = `(${concluidas.length})`;
        document.getElementById("contador-pendentes").textContent = `(${pendentes.length})`;

        // --- TAREFAS CONCLUÍDAS ---
        if (concluidas.length === 0) {
            listaConcluidas.innerHTML = `<div class="vazio">Nenhuma tarefa concluída no momento.</div>`;
        } else {
            const concluidasGerais = concluidas.filter(t => !t.secaoId || !secoes.some(s => s.id === t.secaoId));
            if (concluidasGerais.length > 0) {
                const headerGeral = document.createElement("li");
                headerGeral.className = "secao-header-item secao-header-concluida";
                headerGeral.innerHTML = `<span>📌 Geral / Sem Divisória</span>`;
                listaConcluidas.appendChild(headerGeral);

                concluidasGerais.forEach(t => {
                    listaConcluidas.appendChild(criarElementoTarefa(t, true, null));
                });
            }

            secoes.forEach(secao => {
                const concluidasDaSecao = concluidas.filter(t => t.secaoId === secao.id);
                if (concluidasDaSecao.length > 0) {
                    const headerSecao = document.createElement("li");
                    headerSecao.className = "secao-header-item secao-header-concluida";
                    headerSecao.innerHTML = `
                        <span>📂 <span class="secao-titulo" contenteditable="true" onblur="renomearSecao(${secao.id}, this.textContent)">${secao.nome}</span></span>
                        <button class="btn-apagar-secao" onclick="apagarSecao(${secao.id})" title="Excluir Divisória">✕ Remover</button>
                    `;
                    listaConcluidas.appendChild(headerSecao);

                    concluidasDaSecao.forEach(t => {
                        listaConcluidas.appendChild(criarElementoTarefa(t, true, null));
                    });
                }
            });
        }

        // --- TAREFAS PENDENTES ---
        const idsSecoesExistentes = [0, ...secoes.map(s => s.id)];
        ordemSecoes = ordemSecoes.filter(id => idsSecoesExistentes.includes(id));
        idsSecoesExistentes.forEach(id => {
            if (!ordemSecoes.includes(id)) ordemSecoes.push(id);
        });

        ordemSecoes.forEach(secaoId => {
            if (secaoId === 0) {
                const pendentesGerais = pendentes.filter(t => !t.secaoId || !secoes.some(s => s.id === t.secaoId));
                const wrapper = criarHeaderSecaoPendente(0, "Geral / Sem Divisória");
                listaPendentes.appendChild(wrapper);

                let contadorGeral = 1;
                pendentesGerais.forEach(t => {
                    listaPendentes.appendChild(criarElementoTarefa(t, false, contadorGeral++));
                });
            } else {
                const secaoObj = secoes.find(s => s.id === secaoId);
                if (secaoObj) {
                    const tarefasDaSecao = pendentes.filter(t => t.secaoId === secaoObj.id);
                    const wrapper = criarHeaderSecaoPendente(secaoObj.id, secaoObj.nome);
                    listaPendentes.appendChild(wrapper);

                    let contadorSecao = 1;
                    tarefasDaSecao.forEach(t => {
                        listaPendentes.appendChild(criarElementoTarefa(t, false, contadorSecao++));
                    });
                }
            }
        });
    }

    function criarElementoTarefa(t, isConcluida, numeroExibicao) {
        const li = document.createElement("li");
        li.className = `tarefa-item ${isConcluida ? 'concluida-texto' : ''}`;
        li.dataset.id = t.id;

        li.innerHTML = `
            <div class="tarefa-info">
                ${!isConcluida ? `<span class="drag-handle" title="Arraste para reordenar esta tarefa">☰</span><span class="badge-numero">${numeroExibicao}</span>` : ''}
                <input type="checkbox" ${isConcluida ? 'checked' : ''} onclick="alternarStatus(${t.id})" title="Marcar como concluída/pendente">
                <div class="tarefa-detalhes">
                    <span class="tarefa-titulo" contenteditable="true" onblur="atualizarTexto(${t.id}, 'tarefa', this.textContent)">${t.tarefa}</span>
                    <span class="tarefa-obs" contenteditable="true" onblur="atualizarTexto(${t.id}, 'obs', this.textContent)">${t.obs}</span>
                </div>
            </div>
            <div class="acoes-item">
                ${!isConcluida ? `<button class="btn-apagar" onclick="apagarTarefa(${t.id})">Apagar</button>` : ''}
            </div>
        `;
        return li;
    }

    // ---- Sincronização após arrasto ----
    function sincronizarAposArrasto(tipoArrasto) {
        const listaPendentes = document.getElementById("lista-pendentes");
        const elementos = [...listaPendentes.children];

        if (tipoArrasto === 'secao') {
            const novaOrdemSecoes = [];
            elementos.forEach(el => {
                if (el.classList.contains("secao-header-wrapper")) {
                    const idSecao = Number(el.dataset.secaoId);
                    if (!novaOrdemSecoes.includes(idSecao)) {
                        novaOrdemSecoes.push(idSecao);
                    }
                }
            });
            if (novaOrdemSecoes.length > 0) {
                ordemSecoes = novaOrdemSecoes;
            }
        } else if (tipoArrasto === 'tarefa') {
            let secaoAtualId = null;
            const novasTarefasPendentes = [];

            elementos.forEach(el => {
                if (el.classList.contains("secao-header-wrapper")) {
                    const idSecao = Number(el.dataset.secaoId);
                    secaoAtualId = idSecao === 0 ? null : idSecao;
                } else if (el.classList.contains("tarefa-item")) {
                    const idTarefa = Number(el.dataset.id);
                    const tarefaObj = tarefas.find(t => t.id === idTarefa);
                    if (tarefaObj) {
                        tarefaObj.secaoId = secaoAtualId;
                        novasTarefasPendentes.push(tarefaObj);
                    }
                }
            });

            const concluidas = tarefas.filter(item => item.status === "Pronto");
            tarefas = [...novasTarefasPendentes, ...concluidas];
        }

        salvarProjetoAtual();
        renderizar();
    }

    // ---- Arrasto motorizado ----
    function inicializarArrastoMotorizado() {
        const lista = document.getElementById("lista-pendentes");
        
        let arrastando = null;
        let placeholder = null;
        let tipoArrasto = null; 
        let startY = 0;
        let startTop = 0;

        let lastClientX = 0;
        let lastClientY = 0;
        let scrollSpeed = 0;
        let animFrameId = null;

        lista.addEventListener('mousedown', iniciarArrasto);
        lista.addEventListener('touchstart', iniciarArrasto, { passive: false });

        function autoScrollLoop() {
            if (scrollSpeed !== 0 && arrastando) {
                window.scrollBy(0, scrollSpeed);
                atualizarPosicaoEPlaceholder(lastClientX, lastClientY);
            }
            if (arrastando) {
                animFrameId = requestAnimationFrame(autoScrollLoop);
            }
        }

        function iniciarArrasto(e) {
            const handleTarefa = e.target.closest('.drag-handle');
            const handleSecao = e.target.closest('.drag-handle-secao');
            
            if (!handleTarefa && !handleSecao) return;
            
            if (handleTarefa) {
                tipoArrasto = 'tarefa';
                arrastando = handleTarefa.closest('.tarefa-item');
            } else if (handleSecao) {
                tipoArrasto = 'secao';
                arrastando = handleSecao.closest('.secao-header-wrapper');
            }

            if (!arrastando) return;

            e.preventDefault(); 
            
            const clientY = e.touches ? e.touches[0].clientY : e.clientY;
            const clientX = e.touches ? e.touches[0].clientX : e.clientX;
            
            lastClientX = clientX;
            lastClientY = clientY;

            const rect = arrastando.getBoundingClientRect();
            
            startY = clientY;
            startTop = rect.top;

            if (tipoArrasto === 'tarefa') {
                placeholder = document.createElement('li');
                placeholder.className = 'tarefa-item placeholder';
                placeholder.style.height = `${rect.height}px`;
            } else {
                placeholder = document.createElement('div');
                placeholder.className = 'secao-header-wrapper placeholder-secao';
                placeholder.style.height = `${rect.height}px`;
            }

            arrastando.parentNode.insertBefore(placeholder, arrastando.nextSibling);

            arrastando.style.position = 'fixed';
            arrastando.style.margin = '0';
            arrastando.style.zIndex = '9999';
            arrastando.style.width = `${rect.width}px`;
            arrastando.style.top = `${startTop}px`;
            arrastando.style.left = `${rect.left}px`;
            arrastando.style.pointerEvents = 'none'; 
            arrastando.style.transition = 'none';
            arrastando.style.transform = 'translateY(0px)';
            arrastando.classList.add('dragging');

            document.addEventListener('mousemove', moverArrasto);
            document.addEventListener('touchmove', moverArrasto, { passive: false });
            document.addEventListener('mouseup', soltarArrasto);
            document.addEventListener('touchend', soltarArrasto);

            animFrameId = requestAnimationFrame(autoScrollLoop);
        }

        function moverArrasto(e) {
            if (!arrastando) return;
            if (e.cancelable) e.preventDefault();

            const clientY = e.touches ? e.touches[0].clientY : e.clientY;
            const clientX = e.touches ? e.touches[0].clientX : e.clientX;

            lastClientX = clientX;
            lastClientY = clientY;

            const deltaY = clientY - startY;
            arrastando.style.top = `${startTop + deltaY}px`;

            const margin = 60;
            const windowHeight = window.innerHeight;
            
            if (clientY < margin) {
                scrollSpeed = -Math.min(15, (margin - clientY) / 2);
            } else if (clientY > windowHeight - margin) {
                scrollSpeed = Math.min(15, (clientY - (windowHeight - margin)) / 2);
            } else {
                scrollSpeed = 0;
            }

            atualizarPosicaoEPlaceholder(clientX, clientY);
        }

        function atualizarPosicaoEPlaceholder(clientX, clientY) {
            if (!arrastando || !placeholder) return;

            if (tipoArrasto === 'tarefa') {
                const elementos = [...lista.querySelectorAll('.tarefa-item:not(.dragging):not(.placeholder), .secao-header-wrapper')];
                let elementoProximo = null;
                let menorDistancia = Infinity;

                elementos.forEach(el => {
                    const box = el.getBoundingClientRect();
                    const meio = box.top + box.height / 2;
                    const distancia = clientY - meio;

                    if (distancia < 0 && Math.abs(distancia) < menorDistancia) {
                        menorDistancia = Math.abs(distancia);
                        elementoProximo = el;
                    }
                });

                if (elementoProximo) {
                    lista.insertBefore(placeholder, elementoProximo);
                } else {
                    lista.appendChild(placeholder);
                }
            } else if (tipoArrasto === 'secao') {
                const wrappers = [...lista.querySelectorAll('.secao-header-wrapper:not(.dragging):not(.placeholder-secao)')];
                let wrapperProximo = null;
                let menorDistancia = Infinity;

                wrappers.forEach(el => {
                    const box = el.getBoundingClientRect();
                    const meio = box.top + box.height / 2;
                    const distancia = clientY - meio;

                    if (distancia < 0 && Math.abs(distancia) < menorDistancia) {
                        menorDistancia = Math.abs(distancia);
                        wrapperProximo = el;
                    }
                });

                if (wrapperProximo) {
                    lista.insertBefore(placeholder, wrapperProximo);
                } else {
                    lista.appendChild(placeholder);
                }
            }
        }

        function soltarArrasto() {
            if (!arrastando) return;

            scrollSpeed = 0;
            if (animFrameId) cancelAnimationFrame(animFrameId);

            const tipoAtual = tipoArrasto;

            if (placeholder && placeholder.parentNode) {
                placeholder.parentNode.insertBefore(arrastando, placeholder);
                placeholder.remove();
            }

            arrastando.style.position = '';
            arrastando.style.margin = '';
            arrastando.style.zIndex = '';
            arrastando.style.width = '';
            arrastando.style.top = '';
            arrastando.style.left = '';
            arrastando.style.pointerEvents = '';
            arrastando.style.transition = '';
            arrastando.style.transform = '';
            arrastando.classList.remove('dragging');

            arrastando = null;
            placeholder = null;
            tipoArrasto = null;

            document.removeEventListener('mousemove', moverArrasto);
            document.removeEventListener('touchmove', moverArrasto);
            document.removeEventListener('mouseup', soltarArrasto);
            document.removeEventListener('touchend', soltarArrasto);

            sincronizarAposArrasto(tipoAtual);
        }
    }

    // ======================================================================
    //  INICIALIZAÇÃO
    // ======================================================================
    inicializar();