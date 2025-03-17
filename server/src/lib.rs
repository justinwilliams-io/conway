use spacetimedb::{reducer, table, ReducerContext, ScheduleAt, Table, TimeDuration};

const GRID_SIZE: u32 = 200;

#[table(name = grid, public)]
pub struct Grid {
    #[primary_key]
    gridid: u32,
    cells: Vec<bool>,
}

#[table(name = previous_grid)]
struct PreviousGrid {
    #[primary_key]
    gridid: u32,
    cells: Vec<bool>,
}

#[table(name = grid_info, public)]
pub struct GridInfo {
    #[primary_key]
    gridid: u32,
    generation: u32,
    status: String,
}

#[table(name = update_grid_schedule, scheduled(update_grid))]
struct UpdateGridSchedule {
    #[primary_key]
    #[auto_inc]
    scheduled_id: u64,
    scheduled_at: ScheduleAt,
    gridid: u32,
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
        cells: cells.clone(),
    });

    ctx.db.grid_info().insert(GridInfo {
        gridid: 0,
        generation: 0,
        status: "Evolving".to_string(),
    });

    ctx.db
        .previous_grid()
        .insert(PreviousGrid { gridid: 0, cells });

    ctx.db.update_grid_schedule().insert(UpdateGridSchedule {
        scheduled_id: 0,
        scheduled_at: half_second.into(),
        gridid: 0,
    });
}

#[reducer]
fn update_grid(ctx: &ReducerContext, args: UpdateGridSchedule) {
    if ctx.sender != ctx.identity() {
        return;
    }

    if let Some(grid) = ctx.db.grid().gridid().find(args.gridid) {
        let current_cells = grid.cells;
        let mut next_cells = vec![false; (GRID_SIZE * GRID_SIZE) as usize];
        let mut neighbor_counts = vec![0u8; (GRID_SIZE * GRID_SIZE) as usize]; // u8 since max neighbors = 8

        // Pass 1: Compute neighbor counts
        for x in 0..GRID_SIZE {
            for y in 0..GRID_SIZE {
                let idx = (x * GRID_SIZE + y) as usize;
                if current_cells[idx] {
                    // For each live cell, increment its neighbors' counts
                    for dx in -1..=1 {
                        for dy in -1..=1 {
                            if dx == 0 && dy == 0 {
                                continue;
                            }
                            let nx = (x as i32 + dx).rem_euclid(GRID_SIZE as i32) as u32;
                            let ny = (y as i32 + dy).rem_euclid(GRID_SIZE as i32) as u32;
                            let n_idx = (nx * GRID_SIZE + ny) as usize;
                            neighbor_counts[n_idx] += 1;
                        }
                    }
                }
            }
        }

        // Pass 2: Update next_cells based on neighbor counts
        for x in 0..GRID_SIZE {
            for y in 0..GRID_SIZE {
                let idx = (x * GRID_SIZE + y) as usize;
                let neighbors = neighbor_counts[idx];
                let is_alive = current_cells[idx];
                next_cells[idx] = (is_alive && (neighbors == 2 || neighbors == 3))
                    || (!is_alive && neighbors == 3);
            }
        }

        if let Some(previous_grid) = ctx.db.previous_grid().gridid().find(args.gridid) {
            if let Some(grid_info) = ctx.db.grid_info().gridid().find(args.gridid) {
                let is_oscillating = previous_grid.cells == next_cells;
                let status;

                if is_oscillating {
                    status = "Oscillating".to_string();
                } else {
                    status = "Evolving".to_string();
                }

                ctx.db.grid_info().gridid().update(GridInfo {
                    gridid: args.gridid,
                    status,
                    generation: grid_info.generation + 1,
                });
            }

            ctx.db.previous_grid().gridid().update(PreviousGrid {
                gridid: args.gridid,
                cells: current_cells,
            });
        }

        ctx.db.grid().gridid().update(Grid {
            gridid: args.gridid,
            cells: next_cells,
        });
    }
}

#[reducer]
pub fn reset_grid(ctx: &ReducerContext, gridid: u32) {
    let mut cells = vec![false; (GRID_SIZE * GRID_SIZE) as usize];
    for i in 0..cells.len() {
        let rand: f32 = ctx.random();
        cells[i] = rand < 0.2;
    }
    ctx.db.grid().gridid().update(Grid { gridid, cells });
    ctx.db.grid_info().gridid().update(GridInfo {
        gridid,
        generation: 0,
        status: "Evolving".to_string(),
    });
}

#[reducer]
pub fn add_cells(ctx: &ReducerContext, gridid: u32, cells_to_add: Vec<u32>) {
    if let Some(grid) = ctx.db.grid().gridid().find(gridid) {
        let mut current_cells = grid.cells;

        for idx in cells_to_add {
            current_cells[idx as usize] = true;
        }

        ctx.db.grid().gridid().update(Grid {
            gridid,
            cells: current_cells,
        });
    }
}
