document.addEventListener('DOMContentLoaded', function() {
    let map = L.map('map').setView([53.43275, 14.5481], 17);
    let osm = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png');
    osm.addTo(map);

    navigator.geolocation.getCurrentPosition(function(position) {
        const locationBtn = document.querySelector('#getLocation');
        locationBtn.addEventListener('click', () => {
            let pos = { X: null, Y: null };
            pos.Y = position.coords.latitude;
            pos.X = position.coords.longitude;
            map.setView([pos.Y, pos.X], 17);
        });
    });

    function downloadMap() {
        return html2canvas(document.getElementById('map'), { useCORS: true })
        .then(function (canvas) {
            let url = canvas.toDataURL();
            return { url, width: canvas.width, height: canvas.height };
        });
    }

    function shuffle(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
        return array;
    }

    const puzzleBtn = document.querySelector('#makePuzzles');
    puzzleBtn.addEventListener('click', () => {
        const puzzles = document.querySelector('#puzzles');
        const result = document.querySelector('#result');
        const finalResult = document.querySelector('#final-result');
        
        finalResult.style.display = 'none';
        puzzles.style.display = 'flex';
        puzzles.innerHTML = '';
        result.innerHTML = `
            <div class="result-piece" data-index="0"></div>
            <div class="result-piece" data-index="1"></div>
            <div class="result-piece" data-index="2"></div>
            <div class="result-piece" data-index="3"></div>
            <div class="result-piece" data-index="4"></div>
            <div class="result-piece" data-index="5"></div>
        `;

        downloadMap().then(({ url, width, height }) => {
            const containerWidth = document.getElementById('hero').clientWidth / 2;
            const containerHeight = document.getElementById('hero').clientHeight * 0.6;

            const puzzleWidth = containerWidth / 3;
            const puzzleHeight = containerHeight / 2;

            const positions = [
                { x: 0, y: 0 },
                { x: -puzzleWidth, y: 0 },
                { x: -2 * puzzleWidth, y: 0 },
                { x: 0, y: -puzzleHeight },
                { x: -puzzleWidth, y: -puzzleHeight },
                { x: -2 * puzzleWidth, y: -puzzleHeight }
            ];

            const originalPositions = [...positions];
            shuffle(positions).forEach((pos, index) => {
                let puzzle = document.createElement('div');
                puzzle.className = 'puzzle';
                puzzle.dataset.index = index;
                puzzle.dataset.originalIndex = originalPositions.findIndex(oPos => oPos.x === pos.x && oPos.y === pos.y);
                puzzle.style.backgroundImage = `url(${url})`;
                puzzle.style.backgroundPosition = `${pos.x}px ${pos.y}px`;
                puzzle.style.width = `${puzzleWidth}px`;
                puzzle.style.height = `${puzzleHeight}px`;
                puzzle.draggable = true;
                puzzles.appendChild(puzzle);

                puzzle.addEventListener('dragstart', (event) => {
                    event.dataTransfer.setData('text/plain', puzzle.dataset.index);
                    puzzle.style.opacity = '1';
                });

                puzzle.addEventListener('dragend', () => {
                    puzzle.style.opacity = '1';
                });
            });

            const resultPieces = document.querySelectorAll('.result-piece');

            resultPieces.forEach(piece => {
                piece.style.width = `${puzzleWidth}px`;
                piece.style.height = `${puzzleHeight}px`;

                piece.addEventListener('dragover', (event) => {
                    event.preventDefault();
                });

                piece.addEventListener('dragenter', (event) => {
                    event.preventDefault();
                    if (!piece.hasChildNodes()) {
                        piece.classList.add('active');
                    }
                });

                piece.addEventListener('dragleave', () => {
                    piece.classList.remove('active');
                });

                piece.addEventListener('drop', (event) => {
                    event.preventDefault();
                    const data = event.dataTransfer.getData('text/plain');
                    const draggedIndex = parseInt(data, 10);
                    const draggedElement = document.querySelector(`.puzzle[data-index="${draggedIndex}"]`);

                    if (!piece.hasChildNodes() && draggedElement && draggedElement.classList.contains('puzzle')) {
                        piece.innerHTML = '';
                        const clone = draggedElement.cloneNode(true);
                        clone.style.width = '100%';
                        clone.style.height = '100%';
                        piece.appendChild(clone);
                        clone.classList.add('puzzle-dropped');
                        draggedElement.remove();

                        checkPuzzleCompletion(puzzles);
                    }
                });
            });
        });
    });

    function checkPuzzleCompletion() {
        const resultPieces = document.querySelectorAll('.result-piece');
        let isCorrect = true;

        resultPieces.forEach(piece => {
            const pieceIndex = piece.getAttribute('data-index');
            const child = piece.querySelector('.puzzle-dropped');

            if (!child || child.dataset.originalIndex !== pieceIndex) {
                isCorrect = false;
            }
        });

        const puzzles = document.querySelector('#puzzles');
        const finalResult = document.querySelector('#final-result');

        if (isCorrect) {
            puzzles.style.display = 'none';
            finalResult.style.display = 'flex';
            finalResult.innerHTML = '<div><h2>Brawo! Puzzle są ułożone poprawnie</h2><br><p>Aby zagrać ponownie, wciśnij przycisk Make puzzles</p></div>';
        } else if ([...resultPieces].every(piece => piece.hasChildNodes())) {
            puzzles.style.display = 'none';
            finalResult.style.display = 'flex';
            finalResult.innerHTML = '<div><h2>Nie tym razem! Puzzle są ułożone niepoprawnie</h2><br><p>Aby zagrać ponownie, wciśnij przycisk Make puzzles</p></div>';
        }
    }
});