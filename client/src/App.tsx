import { useEffect, useRef, useState } from 'react';
import { Identity } from '@clockworklabs/spacetimedb-sdk';
import './App.css';
import { Grid, DbConnection, ErrorContext, EventContext } from './module_bindings';

const GRID_SIZE = 200;
const CELL_SIZE = 12;

function useGrid(conn: DbConnection | null): [boolean[], number] {
    const [grid, setGrid] = useState<boolean[]>(Array(GRID_SIZE * GRID_SIZE).fill(false));
    const [generation, setGeneration] = useState<number>(0);

    useEffect(() => {
        if (!conn) return;

        const onInsert = (_ctx: EventContext, newRow: Grid) => {
            setGrid(newRow.cells);
            setGeneration(newRow.generation);
        };
        conn.db.grid.onInsert(onInsert);

        const onUpdate = (_ctx: EventContext, _oldRow: Grid, newRow: Grid) => {
            setGrid(newRow.cells);
            setGeneration(newRow.generation);
        };
        conn.db.grid.onUpdate(onUpdate);

        return () => {
            conn.db.grid.removeOnInsert(onInsert);
            conn.db.grid.removeOnUpdate(onUpdate);
        };

    }, [conn]);

    return [grid, generation];
};

function App() {
    const [loaded, setLoaded] = useState<boolean>(false);
    const [, setIdentity] = useState<Identity | null>(null);
    const [conn, setConn] = useState<DbConnection | null>(null);
    const [hoverCell, setHoverCell] = useState<number | null>(null);
    const [newCells, setNewCells] = useState<number[]>([]);
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        const subscribeToQueries = (conn: DbConnection, queries: string[]) => {
            for (const query of queries) {
                conn?.subscriptionBuilder()
                    .onApplied(() => {
                        console.log('SDK client cache initialized.');
                        setLoaded(true);
                    })
                    .subscribe(query);
            }

        };

        const onConnect = (conn: DbConnection, identity: Identity, token: string) => {
            setIdentity(identity);
            localStorage.setItem('auth_token', token);
            console.log('Connected to SpacetimeDB with identity:', identity.toHexString());

            subscribeToQueries(conn, ['SELECT * FROM grid WHERE gridid = 0']);
        };

        const onDisconnect = () => {
            console.log('Disconnected from SpacetimeDB');
            setLoaded(false);
        };

        const onConnectError = (_conn: ErrorContext, err: Error) => {
            console.log('Error connecting to SpacetimeDB:', err);
        };

        setConn(
            DbConnection.builder()
                .withUri('wss://maincloud.spacetimedb.com')
                .withModuleName('conway')
                .withToken(localStorage.getItem('auth_token') || '')
                .onConnect(onConnect)
                .onDisconnect(onDisconnect)
                .onConnectError(onConnectError)
                .build()
        );
    }, []);

    const [cells, generation] = useGrid(conn);

    useEffect(() => {
        const canvas = canvasRef.current; if (canvas) {
            const ctx = canvas.getContext('2d');
            if (ctx) {
                ctx.clearRect(0, 0, canvas.width, canvas.height);
                for (let x = 0; x < GRID_SIZE; x++) {
                    for (let y = 0; y < GRID_SIZE; y++) {
                        const idx = x * GRID_SIZE + y;
                        const isNewCell = newCells.includes(idx);
                        ctx.fillStyle = isNewCell ? 'yellow' : cells[x * GRID_SIZE + y] ? "white" : "black";
                        ctx.fillRect(x * CELL_SIZE, y * CELL_SIZE - 1, CELL_SIZE - 1, CELL_SIZE - 1);
                    }
                }

                if (hoverCell !== null) {
                    const x = Math.floor(hoverCell / GRID_SIZE);
                    const y = hoverCell % GRID_SIZE;
                    ctx.strokeStyle = '#3498db';
                    ctx.lineWidth = 2;
                    ctx.strokeRect(x * CELL_SIZE, y * CELL_SIZE, CELL_SIZE, CELL_SIZE);
                }
            }
        }
    }, [cells, newCells, hoverCell]);

    const handleCanvasClick = (event: React.MouseEvent<HTMLCanvasElement>) => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const rect = canvas.getBoundingClientRect();
        const clickX = event.clientX - rect.left;
        const clickY = event.clientY - rect.top;

        const cellX = Math.floor(clickX / CELL_SIZE);
        const cellY = Math.floor(clickY / CELL_SIZE);

        if (cellX >= 0 && cellX < GRID_SIZE && cellY >= 0 && cellY < GRID_SIZE) {
            const idx = cellX * GRID_SIZE + cellY;

            setNewCells(prev =>
                prev.includes(idx) ? prev.filter(i => i !== idx) : [...prev, idx]
            );
        }
    }

    const handleMouseMove = (event: React.MouseEvent<HTMLCanvasElement>) => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const rect = canvas.getBoundingClientRect();
        const mouseX = event.clientX - rect.left;
        const mouseY = event.clientY - rect.top;

        const cellX = Math.floor(mouseX / CELL_SIZE);
        const cellY = Math.floor(mouseY / CELL_SIZE);

        if (cellX >= 0 && cellX < GRID_SIZE && cellY >= 0 && cellY < GRID_SIZE) {
            const idx = cellX * GRID_SIZE + cellY;
            setHoverCell(idx);
        } else {
            setHoverCell(null);
        }
    }

    const handleMouseLeave = () => {
        setHoverCell(null);
    }

    const handleAddCells = () => {
        if (newCells.length === 0) {
            return;
        }

        conn?.reducers.addCells(newCells);
        setNewCells([]);
    }

    const handleResetGrid = () => {
        conn?.reducers.resetGrid();
    }

    return (
        <>
            <div className='App'>
                <div className='profile'>
                    <h1>Conway's Game of Life</h1>
                </div>
            </div>
            <div>
                {loaded &&
                    <canvas
                        width={GRID_SIZE * CELL_SIZE}
                        height={GRID_SIZE * CELL_SIZE}
                        onClick={handleCanvasClick}
                        onMouseMove={handleMouseMove}
                        onMouseLeave={handleMouseLeave}
                        ref={canvasRef}
                    />
                }
            </div>
            <div className='App'>
                <div className='profile' style={{ whiteSpace: 'pre-wrap' }}>
                    <h1>Generation: {generation}</h1>
                    <button onClick={handleResetGrid}>Reset Grid</button>
                    <button onClick={handleAddCells}>Add Cells</button>
                </div>
                <div className='new-message'>
                    <p>Powered by <a href='https://spacetimedb.com/home' target='_blank'>SpacetimeDB</a></p>
                </div>
            </div>
        </>
    );
}

export default App;
