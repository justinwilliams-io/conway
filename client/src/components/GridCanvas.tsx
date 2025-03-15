import { useEffect, useRef, useState } from 'react';
import { DbConnection, EventContext, Grid } from '../module_bindings';

type GridProps = {
    conn: DbConnection | null;
    gridId: number;
    newCells: React.RefObject<number[]>;
}

const GRID_SIZE = 200;

const GridCanvas = ({ conn, gridId, newCells }: GridProps) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const canvasWrapperRef = useRef<HTMLDivElement>(null);
    const lastHoveredCellRef = useRef<number | null>(null);
    const [cells, setCells] = useState<boolean[]>(Array(GRID_SIZE * GRID_SIZE).fill(false));

    useEffect(() => {
        if (!conn) return;
        const canvas = canvasRef.current;
        const canvasWrapper = canvasWrapperRef.current;

        if (!canvas || !canvasWrapper) return;
        canvas.width = canvasWrapper.clientWidth;
        canvas.height = canvasWrapper.clientWidth
        const cellSize = canvasWrapper.clientWidth / GRID_SIZE;

        const ctx = canvas.getContext('2d');

        if (!ctx) return;

        ctx.clearRect(0, 0, canvas.width, canvas.height);
        for (let x = 0; x < GRID_SIZE; x++) {
            for (let y = 0; y < GRID_SIZE; y++) {
                const idx = x * GRID_SIZE + y;
                const isNewCell = newCells.current.includes(idx);
                ctx.fillStyle = isNewCell ? 'yellow' : cells[x * GRID_SIZE + y] ? "white" : "black";
                ctx.fillRect(x * cellSize, y * cellSize - 1, cellSize - 1, cellSize - 1);
            }
        }

        if (lastHoveredCellRef.current !== null) {
            const x = Math.floor(lastHoveredCellRef.current / GRID_SIZE);
            const y = lastHoveredCellRef.current % GRID_SIZE;
            ctx.strokeStyle = '#3498db';
            ctx.lineWidth = 4;
            ctx.strokeRect(x * cellSize, y * cellSize, cellSize, cellSize);
        }
    }, [conn, cells, newCells]);

    useEffect(() => {
        if (!conn) return;
        const canvas = canvasRef.current;
        const canvasWrapper = canvasWrapperRef.current;

        if (!canvas || !canvasWrapper) return;

        const onInsert = (_ctx: EventContext, newRow: Grid) => {
            setCells(newRow.cells);
        };
        conn.db.grid.onInsert(onInsert);

        const onUpdate = (_ctx: EventContext, _oldRow: Grid, newRow: Grid) => {
            setCells(newRow.cells);
        };
        conn.db.grid.onUpdate(onUpdate);

        return () => {
            conn.db.grid.removeOnInsert(onInsert);
            conn.db.grid.removeOnUpdate(onUpdate);
        };
    }, [conn, newCells]);

    const handleCanvasClick = (event: React.MouseEvent<HTMLCanvasElement>) => {
        const canvas = canvasRef.current;
        const canvasWrapper = canvasWrapperRef.current;

        if (!canvas || !canvasWrapper) return;

        const cellSize = canvasWrapper.clientWidth / GRID_SIZE;

        const rect = canvas.getBoundingClientRect();
        const clickX = event.clientX - rect.left;
        const clickY = event.clientY - rect.top;

        const cellX = Math.floor(clickX / cellSize);
        const cellY = Math.floor(clickY / cellSize);

        if (cellX >= 0 && cellX < GRID_SIZE && cellY >= 0 && cellY < GRID_SIZE) {
            const idx = cellX * GRID_SIZE + cellY;

            newCells.current = newCells.current.includes(idx) ? newCells.current.filter(i => i !== idx) : [...newCells.current, idx]
        }
    }

    const handleMouseMove = (event: React.MouseEvent<HTMLCanvasElement>) => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const rect = canvas.getBoundingClientRect();
        const mouseX = event.clientX - rect.left;
        const mouseY = event.clientY - rect.top;

        const cellSize = canvas.width / GRID_SIZE;
        const cellX = Math.floor(mouseX / cellSize);
        const cellY = Math.floor(mouseY / cellSize);

        if (cellX >= 0 && cellX < GRID_SIZE && cellY >= 0 && cellY < GRID_SIZE) {
            const idx = cellX * GRID_SIZE + cellY;

            lastHoveredCellRef.current = idx;
        } else if (lastHoveredCellRef.current !== null) {
            lastHoveredCellRef.current = null;
        }
    };

    const handleMouseLeave = () => {
        lastHoveredCellRef.current = null;
    };

    useEffect(() => {
        const query = `SELECT * FROM grid WHERE gridid = ${gridId}`;
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
        <div ref={canvasWrapperRef} className='canvas-wrapper'>
            <canvas
                onClick={handleCanvasClick}
                onMouseMove={handleMouseMove}
                onMouseLeave={handleMouseLeave}
                ref={canvasRef}
            />
        </div>
    );
};

export default GridCanvas;
