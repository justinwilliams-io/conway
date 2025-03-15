import { useEffect, useState, useRef } from 'react';
import { Identity } from '@clockworklabs/spacetimedb-sdk';
import './App.css';
import { DbConnection, ErrorContext } from './module_bindings';
import GridCanvas from './components/GridCanvas';
import GridInfo from './components/GridInfo';

const SPACETIMEDB_URI = import.meta.env.VITE_SPACETIME_URI || 'ws://localhost:3000';

function App() {
    const [loaded, setLoaded] = useState<boolean>(false);
    const [, setIdentity] = useState<Identity | null>(null);
    const [conn, setConn] = useState<DbConnection | null>(null);
    const newCells = useRef<number[]>([]);
    const [gridId,] = useState<number>(0);

    useEffect(() => {
        const onConnect = (_conn: DbConnection, identity: Identity, token: string) => {
            setIdentity(identity);
            localStorage.setItem('auth_token', token);
            console.log('Connected to SpacetimeDB with identity:', identity.toHexString());
            setTimeout(() => {
                setLoaded(true);
            }, 200);
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
                .withUri(SPACETIMEDB_URI)
                .withModuleName('conway')
                .withToken(localStorage.getItem('auth_token') || '')
                .onConnect(onConnect)
                .onDisconnect(onDisconnect)
                .onConnectError(onConnectError)
                .build()
        );
    }, []);

    const handleAddCells = () => {
        if (newCells.current.length === 0) {
            return;
        }

        conn?.reducers.addCells(newCells.current);
        newCells.current = [];
    }

    return (
        <>
            <div className='App'>
                <div className='profile'>
                    <h1>Conway's Game of Life</h1>
                </div>
            </div>
            {!loaded &&
                <div className='App'>
                    <p style={{ margin: '0 auto' }}>Loading</p>
                </div>
            }
            {loaded && <GridCanvas conn={conn} gridId={gridId} newCells={newCells} />}
            <div className='App'>
                {loaded && <GridInfo conn={conn} gridId={gridId} handleAddCells={handleAddCells} />}
                <div className='new-message'>
                    <p>Powered by <a href='https://spacetimedb.com/home' target='_blank'>SpacetimeDB</a></p>
                </div>
            </div>
        </>
    );
}

export default App;
