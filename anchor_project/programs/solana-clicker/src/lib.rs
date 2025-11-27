use anchor_lang::prelude::*;

declare_id!("Fg6PaFpoGXkYsidMpWTK6W2BeZ7FEfcYkg476zPFsLnS");

#[program]
pub mod solana_clicker {
    use super::*;

    pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
        let user_stats = &mut ctx.accounts.user_stats;
        user_stats.clicks = 0;
        user_stats.bump = ctx.bumps.user_stats;
        msg!("User stats initialized!");
        Ok(())
    }

    pub fn click(ctx: Context<Click>) -> Result<()> {
        let user_stats = &mut ctx.accounts.user_stats;
        user_stats.clicks += 1;
        msg!("Clicked! New score: {}", user_stats.clicks);
        Ok(())
    }
}

#[derive(Accounts)]
pub struct Initialize<'info> {
    #[account(
        init,
        payer = user,
        space = 8 + 8 + 1, // Discriminator + u64 + u8
        seeds = [b"user-stats", user.key().as_ref()],
        bump
    )]
    pub user_stats: Account<'info, UserStats>,
    #[account(mut)]
    pub user: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct Click<'info> {
    #[account(
        mut,
        seeds = [b"user-stats", user.key().as_ref()],
        bump = user_stats.bump,
    )]
    pub user_stats: Account<'info, UserStats>,
    pub user: Signer<'info>,
}

#[account]
pub struct UserStats {
    pub clicks: u64,
    pub bump: u8,
}
