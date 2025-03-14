import { useEffect, useRef, useState } from 'react';
import { Identity } from '@clockworklabs/spacetimedb-sdk';
import './App.css';
import { Grid, DbConnection, ErrorContext, EventContext } from './module_bindings';

const GRID_SIZE = 200;
const CELL_SIZE = 4;

function useGrid(conn: DbConnection | null): boolean[] {
    const [grid, setGrid] = useState<boolean[]>(Array(GRID_SIZE * GRID_SIZE).fill(false));

    useEffect(() => {
        if (!conn) return;

        const onInsert = (_ctx: EventContext, newRow: Grid) => {
            setGrid(newRow.cells);
        };
        conn.db.grid.onInsert(onInsert);

        const onUpdate = (_ctx: EventContext, _oldRow: Grid, newRow: Grid) => {
            setGrid(newRow.cells);
        };
        conn.db.grid.onUpdate(onUpdate);

        return () => {
            conn.db.grid.removeOnInsert(onInsert);
            conn.db.grid.removeOnUpdate(onUpdate);
        };

    }, [conn]);

    return grid;
};

function App() {
    const [loaded, setLoaded] = useState<boolean>(false);
    const [, setIdentity] = useState<Identity | null>(null);
    const [conn, setConn] = useState<DbConnection | null>(null);
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

            subscribeToQueries(conn, ['SELECT * FROM grid']);
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
                .withUri('ws://localhost:3000')
                .withModuleName('conway')
                .withToken(localStorage.getItem('auth_token') || '')
                .onConnect(onConnect)
                .onDisconnect(onDisconnect)
                .onConnectError(onConnectError)
                .build()
        );
    }, []);

    const grid = useGrid(conn);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (canvas) {
            const ctx = canvas.getContext('2d');
            if (ctx) {
                ctx.clearRect(0, 0, canvas.width, canvas.height);
                for (let x = 0; x < GRID_SIZE; x++) {
                    for (let y = 0; y < GRID_SIZE; y++) {
                        ctx.fillStyle = grid[x * GRID_SIZE + y] ? "white" : "black";
                        ctx.fillRect(x * CELL_SIZE, y * CELL_SIZE - 1, CELL_SIZE - 1, CELL_SIZE - 1);
                    }
                }
            }
        }
    }, [grid]);

    const handleResetGrid = () => {
        conn?.reducers.resetGrid();
    }

    return (
        <div className='App'>
            <div className='profile'>
                <h1>Conway's Game of Life</h1>
                <button onClick={handleResetGrid}>Reset Grid</button>
            </div>
            <div className='message'>
                {loaded &&
                    <canvas
                        width={GRID_SIZE * CELL_SIZE}
                        height={GRID_SIZE * CELL_SIZE}
                        ref={canvasRef}
                    />
                }
            </div>
            <div className='system' style={{ whiteSpace: 'pre-wrap' }}>
                <h1>Messages</h1>
                <div>
                    <p>Coming soon...</p>
                </div>
            </div>
            <div className='new-message'>
                <p>Powered by <a href='https://spacetimedb.com/home' target='_blank'>SpacetimeDB</a></p>
            </div>
        </div>
    );
}

export default App;
