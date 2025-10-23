document.addEventListener('DOMContentLoaded', () => {
    // Elementos del DOM
    const selectorVariables = document.getElementById('num-vars');
    const entradaMinterminos = document.getElementById('minterms-input');
    const botonSimplificar = document.getElementById('simplify-button');
    const contenedorResultado = document.getElementById('result-container');

    // Evento para simplificar
    botonSimplificar.addEventListener('click', simplificar);

    // Enter para simplificar
    entradaMinterminos.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            simplificar();
        }
    });

    function simplificar() {
        const numVars = parseInt(selectorVariables.value);
        const mintermsStr = entradaMinterminos.value.trim();
        // Animación
        botonSimplificar.style.transform = 'scale(0.95)';
        setTimeout(() => {
            botonSimplificar.style.transform = 'scale(1)';
        }, 100);
        // Limpiar resultado anterior
        contenedorResultado.innerHTML = '';
        contenedorResultado.className = '';
        // Validación
        if (mintermsStr === '') {
            mostrarError('Por favor, introduce al menos un mintermino.');
            return;
        }
        const minterminos = mintermsStr.split(',')
            .map(s => parseInt(s.trim()))
            .filter(n => !isNaN(n));
        const maxMinterm = Math.pow(2, numVars) - 1;
        const minterminosInvalidos = minterminos.filter(m => m < 0 || m > maxMinterm);
        if (minterminosInvalidos.length > 0) {
            mostrarError(`Los minterminos [${minterminosInvalidos.join(', ')}] están fuera del rango para ${numVars} variables (0-${maxMinterm}).`);
            return;
        }
        if (minterminos.length === 0) {
            mostrarError('No se encontraron minterminos válidos.');
            return;
        }
        try {
            const resultado = simplificarMinterminos(minterminos, numVars);
            mostrarResultado(resultado, numVars, minterminos);
        } catch (e) {
            mostrarError(`Ocurrió un error: ${e.message}`);
        }
    }

    function mostrarError(mensaje) {
        contenedorResultado.className = 'result-error';
        contenedorResultado.innerHTML = `
            <div class="result-icon">
                <i class="fas fa-exclamation-triangle"></i>
            </div>
            <p class="error">${mensaje}</p>
        `;
    }

    function mostrarResultado(terminosSimplificados, numVars, minterminos) {
        if (!terminosSimplificados || terminosSimplificados.length === 0) {
            mostrarError('La función es 0 (cero).');
            return;
        }
        contenedorResultado.className = 'result-success';
        if (terminosSimplificados.length === 1 && terminosSimplificados[0] === '-'.repeat(numVars)) {
            contenedorResultado.innerHTML = `
                <div class="result-icon">
                    <i class="fas fa-check-circle"></i>
                </div>
                <p><strong>✨ Expresión simplificada:</strong></p>
                <p class="final-expression">F = 1</p>
                <p style="margin-top: 15px; color: var(--text-secondary); font-size: 0.9rem;">
                    <i class="fas fa-info-circle"></i> La función siempre es verdadera
                </p>
            `;
            return;
        }
        const expresionFormateada = formatearExpresion(terminosSimplificados, numVars);
        const nombresVariables = ['A', 'B', 'C', 'D', 'E', 'F'].slice(0, numVars);
        contenedorResultado.innerHTML = `
            <div class="result-icon">
                <i class="fas fa-check-circle"></i>
            </div>
            <p><strong>✨ Expresión simplificada:</strong></p>
            <p class="final-expression">F = ${expresionFormateada}</p>
            <div style="margin-top: 20px; padding: 15px; background: var(--input-bg); border-radius: 12px; font-size: 0.9rem; color: var(--text-secondary);">
                <p style="margin-bottom: 8px;"><i class="fas fa-info-circle"></i> <strong>Detalles:</strong></p>
                <p style="margin: 5px 0;">• Variables: ${nombresVariables.join(', ')}</p>
                <p style="margin: 5px 0;">• Minterminos: ${minterminos.sort((a, b) => a - b).join(', ')}</p>
                <p style="margin: 5px 0;">• Términos simplificados: ${terminosSimplificados.length}</p>
            </div>
        `;
    }

    function formatearExpresion(terminos, numVars) {
        const nombresVariables = ['A', 'B', 'C', 'D', 'E', 'F'];
        const expresion = terminos.map(termino => {
            let str = '';
            for (let i = 0; i < numVars; i++) {
                if (termino[i] === '1') {
                    str += nombresVariables[i];
                } else if (termino[i] === '0') {
                    str += nombresVariables[i] + "'";
                }
            }
            return str;
        }).join(' + ');
        return expresion;
    }
    // === ALGORITMO DE SIMPLIFICACIÓN (Quine-McCluskey) ===
    function simplificarMinterminos(minterminos, numVars) {
        // Eliminar duplicados y ordenar
        minterminos = Array.from(new Set(minterminos)).sort((a, b) => a - b);
        if (minterminos.length === 0) return [];
        // Paso 1: Generar los términos binarios
        let grupos = {};
        for (let m of minterminos) {
            const bin = m.toString(2).padStart(numVars, '0');
            const unos = (bin.match(/1/g) || []).length;
            if (!grupos[unos]) grupos[unos] = [];
            grupos[unos].push({bin, minterms: [m], usado: false});
        }
        // Paso 2: Combinar términos
        let nuevosGrupos = {};
        let huboCombinacion = true;
        let primos = [];
        while (huboCombinacion) {
            huboCombinacion = false;
            nuevosGrupos = {};
            const indices = Object.keys(grupos).map(Number).sort((a, b) => a - b);
            for (let i = 0; i < indices.length - 1; i++) {
                const grupoA = grupos[indices[i]];
                const grupoB = grupos[indices[i + 1]];
                for (let termA of grupoA) {
                    for (let termB of grupoB) {
                        const diff = diferenciaBinaria(termA.bin, termB.bin);
                        if (diff.cuenta === 1) {
                            huboCombinacion = true;
                            const combinado = termA.bin.split('');
                            combinado[diff.indice] = '-';
                            const nuevoBin = combinado.join('');
                            const nuevoMinterms = Array.from(new Set([...termA.minterms, ...termB.minterms])).sort((a, b) => a - b);
                            if (!existeEnGrupo(nuevosGrupos, indices[i], nuevoBin)) {
                                if (!nuevosGrupos[indices[i]]) nuevosGrupos[indices[i]] = [];
                                nuevosGrupos[indices[i]].push({bin: nuevoBin, minterms: nuevoMinterms, usado: false});
                            }
                            termA.usado = true;
                            termB.usado = true;
                        }
                    }
                }
            }
            // Guardar los que no se usaron como primos
            for (let idx of indices) {
                for (let term of grupos[idx]) {
                    if (!term.usado && !primos.some(p => p.bin === term.bin)) {
                        primos.push(term);
                    }
                }
            }
            grupos = nuevosGrupos;
        }
        // Paso 3: Tabla de cobertura
        let tabla = {};
        for (let m of minterminos) {
            tabla[m] = [];
            for (let p of primos) {
                if (cubre(p.bin, m)) {
                    tabla[m].push(p.bin);
                }
            }
        }
        // Paso 4: Encontrar los primos esenciales
        let solucion = [];
        let cubiertos = new Set();
        while (true) {
            let esencial = null;
            for (let m in tabla) {
                if (tabla[m].length === 1 && !cubiertos.has(Number(m))) {
                    esencial = tabla[m][0];
                    break;
                }
            }
            if (!esencial) break;
            solucion.push(esencial);
            // Marcar minterminos cubiertos por este PI
            for (let m in tabla) {
                if (cubre(esencial, Number(m))) {
                    cubiertos.add(Number(m));
                }
            }
        }
        // Paso 5: Cubrir los minterminos restantes (selección mínima real)
        let restantes = minterminos.filter(m => !cubiertos.has(m));
        if (restantes.length > 0) {
            // Construir tabla de cobertura solo para los minterminos restantes
            let tablaRestante = {};
            for (let m of restantes) {
                tablaRestante[m] = [];
                for (let p of primos) {
                    if (cubre(p.bin, m)) {
                        tablaRestante[m].push(p.bin);
                    }
                }
            }
            // Buscar la combinación mínima de primos que cubra todos los minterminos restantes
            let combinaciones = obtenerCombinaciones(tablaRestante);
            // Elegir la combinación con menos términos
            let mejor = combinaciones[0];
            for (let c of combinaciones) {
                if (c.length < mejor.length) mejor = c;
            }
            for (let pi of mejor) {
                if (!solucion.includes(pi)) solucion.push(pi);
            }
        }
        return solucion;
    }

    // Devuelve todas las combinaciones posibles de primos que cubren los minterminos restantes
    function obtenerCombinaciones(tabla) {
        let listas = Object.values(tabla);
        if (listas.length === 0) return [[]];
        // Producto cartesiano de las listas
        let resultado = [[]];
        for (let lista of listas) {
            let temp = [];
            for (let r of resultado) {
                for (let item of lista) {
                    if (!r.includes(item)) {
                        temp.push([...r, item]);
                    }
                }
            }
            resultado = temp;
        }
        // Si no hay solución, devolver [[]]
        return resultado.length ? resultado : [[]];
    }

    function diferenciaBinaria(a, b) {
        let cuenta = 0;
        let indice = -1;
        for (let i = 0; i < a.length; i++) {
            if (a[i] !== b[i]) {
                cuenta++;
                indice = i;
            }
        }
        return {cuenta, indice};
    }

    function existeEnGrupo(grupos, idx, bin) {
        if (!grupos[idx]) return false;
        return grupos[idx].some(t => t.bin === bin);
    }

    function cubre(bin, minterm) {
        const minBin = minterm.toString(2).padStart(bin.length, '0');
        for (let i = 0; i < bin.length; i++) {
            if (bin[i] !== '-' && bin[i] !== minBin[i]) return false;
        }
        return true;
    }
});