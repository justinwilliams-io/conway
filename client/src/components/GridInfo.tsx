import { useEffect, useState } from "react";
import { DbConnection, EventContext, GridInfo } from "../module_bindings";

type GridInfoProps = {
    conn: DbConnection | null;
    gridId: number;
    handleAddCells: () => void;
}

const GridInfoComponent = ({ conn, gridId, handleAddCells }: GridInfoProps) => {
    const [info, setInfo] = useState<GridInfo>({ gridid: gridId, generation: 0, status: '' });
    const handleResetGrid = () => {
        conn?.reducers.resetGrid(gridId);
    }

    useEffect(() => {
        if (!conn) return;

        const onInsert = (_ctx: EventContext, newRow: GridInfo) => {
            setInfo(newRow);
        };
        conn.db.gridInfo.onInsert(onInsert);

        const onUpdate = (_ctx: EventContext, _oldRow: GridInfo, newRow: GridInfo) => {
            setInfo(newRow);
        };
        conn.db.gridInfo.onUpdate(onUpdate);

        return () => {
            conn.db.gridInfo.removeOnInsert(onInsert);
            conn.db.gridInfo.removeOnUpdate(onUpdate);
        };
    }, [conn]);

    useEffect(() => {
        const query = `SELECT * FROM grid_info WHERE gridid = ${gridId}`;
        const sub = conn?.subscriptionBuilder()
            .onApplied(() => {
                console.log('SDK client cache initialized.');
            })
            .subscribe(query);

        return () => {
            if (sub?.isActive()) {
                sub?.unsubscribe();
            }
        }
    }, [conn, gridId])

    return (
        <div className='profile' style={{ whiteSpace: 'pre-wrap' }}>
            <h1>Generation: {info.generation}</h1>
            <h2>Status: {info.status}</h2>
            <button onClick={handleResetGrid}>Reset Grid</button>
            <button onClick={handleAddCells}>Add Cells</button>
        </div>
    );
};

export default GridInfoComponent;
