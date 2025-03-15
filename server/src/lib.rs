use spacetimedb::{reducer, table, ReducerContext, ScheduleAt, Table, TimeDuration};

const GRID_SIZE: u32 = 200;

#[table(name = grid, public)]
pub struct Grid {
    #[primary_key]
    gridid: u32,
    generation: u32,
    cells: Vec<bool>,
}

#[table(name = update_grid_schedule, scheduled(update_grid))]
struct UpdateGridSchedule {
    #[primary_key]
    #[auto_inc]
    scheduled_id: u64,
    scheduled_at: ScheduleAt,
}

#[reducer(init)]
pub fn init(ctx: &ReducerContext) {
    let half_second = TimeDuration::from_micros(1_000_000 / 30);

    let mut cells = vec![false; (GRID_SIZE * GRID_SIZE) as usize];
    for i in 0..cells.len() {
        let rand: f32 = ctx.random();
        cells[i] = rand < 0.1;
    }
    ctx.db.grid().insert(Grid {
        gridid: 0,
        generation: 1,
        cells,
    });

    ctx.db.update_grid_schedule().insert(UpdateGridSchedule {
        scheduled_id: 0,
        scheduled_at: half_second.into(),
    });
}

#[reducer]
fn update_grid(ctx: &ReducerContext, _args: UpdateGridSchedule) {
    if ctx.sender != ctx.identity() {
        return;
    }

    if let Some(grid) = ctx.db.grid().gridid().find(0) {
        let current_cells = grid.cells;
        let mut next_cells = vec![false; (GRID_SIZE * GRID_SIZE) as usize];

        for x in 0..GRID_SIZE {
            for y in 0..GRID_SIZE {
                let idx = (x * GRID_SIZE + y) as usize;
                let neighbors = count_neighbors(x, y, &current_cells);
                let is_alive = current_cells[idx];
                next_cells[idx] = (is_alive && (neighbors == 2 || neighbors == 3))
                    || (!is_alive && neighbors == 3);
            }
        }

        ctx.db.grid().gridid().update(Grid {
            gridid: 0,
            generation: grid.generation + 1,
            cells: next_cells,
        });
    }
}

#[reducer]
pub fn reset_grid(ctx: &ReducerContext) {
    let mut cells = vec![false; (GRID_SIZE * GRID_SIZE) as usize];
    for i in 0..cells.len() {
        let rand: f32 = ctx.random();
        cells[i] = rand < 0.2;
    }
    ctx.db.grid().gridid().update(Grid {
        gridid: 0,
        generation: 1,
        cells,
    });
}

#[reducer]
pub fn add_cells(ctx: &ReducerContext, cells_to_add: Vec<u32>) {
    if let Some(grid) = ctx.db.grid().gridid().find(0) {
        let mut current_cells = grid.cells;

        for idx in cells_to_add {
            current_cells[idx as usize] = true;
        }

        ctx.db.grid().gridid().update(Grid {
            gridid: 0,
            generation: grid.generation,
            cells: current_cells,
        });
    }
}

fn count_neighbors(x: u32, y: u32, current_cells: &Vec<bool>) -> u32 {
    let mut count = 0;
    for dx in -1..=1 {
        for dy in -1..=1 {
            if dx == 0 && dy == 0 {
                continue;
            }
            let nx = (x as i32 + dx).rem_euclid(GRID_SIZE as i32) as u32;
            let ny = (y as i32 + dy).rem_euclid(GRID_SIZE as i32) as u32;
            if current_cells[(nx * GRID_SIZE + ny) as usize] {
                count += 1;
            }
        }
    }

    count
}
