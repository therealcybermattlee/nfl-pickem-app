import React, { useState } from 'react';
import { Game, GameStatus, FamilyPick } from '../../types/api';
import { GameLockStatus, useGameStatus } from '../GameLockStatus';
import { CountdownTimer } from '../CountdownTimer';
import { formatGameDate, getGameLockTime } from '../../utils/timeUtils';
import { MobilePickModal } from './MobilePickModal';

interface MobileGameCardProps {
  game: Game | GameStatus;
  userHasPick?: boolean;
  userPickTeamId?: string;
  onPickSubmit?: (gameId: string, teamId: string) => Promise<void>;
  className?: string;
  lockOffsetMinutes?: number;
  familyPicks?: FamilyPick[];
  showFamilyPicks?: boolean;
}

// Family picks display component optimized for mobile
const FamilyPicksDisplay: React.FC<{
  picks: FamilyPick[];
  teamId: string;
}> = ({ picks, teamId }) => {
  const teamPicks = picks.filter(p => p.teamId === teamId);

  if (teamPicks.length === 0) return null;

  return (
    <div className="flex gap-1 mt-1.5 justify-center flex-wrap">
      {teamPicks.map(pick => (
        <div
          key={pick.userId}
          className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold text-white ${
            pick.isCurrentUser ? 'ring-1 ring-offset-1 ring-gray-400' : ''
          }`}
          style={{ backgroundColor: pick.userColor }}
          title={pick.userName}
        >
          {pick.userInitial}
        </div>
      ))}
    </div>
  );
};

// Utility function to format odds for display
const formatSpread = (spread: number): string => {
  const sign = spread > 0 ? '+' : '';
  return `${sign}${spread.toFixed(1)}`;
};

const formatOverUnder = (overUnder: number): string => {
  return overUnder.toFixed(1);
};

export const MobileGameCard: React.FC<MobileGameCardProps> = ({
  game,
  userHasPick = false,
  userPickTeamId,
  onPickSubmit,
  className = '',
  lockOffsetMinutes = 0,
  familyPicks = [],
  showFamilyPicks = false
}) => {
  const [isPickModalOpen, setIsPickModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Use API lock status if available, otherwise calculate locally
  const isGameStatusAPI = 'isLocked' in game;
  const apiGameStatus = isGameStatusAPI ? game as GameStatus : null;
  const gameStatus = useGameStatus(game.gameDate, game.isCompleted, lockOffsetMinutes);
  const lockTime = apiGameStatus?.lockTime ? new Date(apiGameStatus.lockTime) : getGameLockTime(game.gameDate, lockOffsetMinutes);
  const canSubmitPick = isGameStatusAPI ? (!apiGameStatus?.isLocked && !game.isCompleted) : (gameStatus === 'upcoming');

  // Helper functions for winner styling
  const isWinningTeam = (teamId: string | undefined): boolean => {
    return game.isCompleted && game.winnerTeamId === teamId;
  };

  const getWinnerDisplay = (): { winnerName: string; winnerScore: number; loserScore: number; margin: number } | null => {
    if (!game.isCompleted || !game.winnerTeamId || game.homeScore === null || game.awayScore === null) {
      return null;
    }

    const isHomeWinner = game.winnerTeamId === game.homeTeam.id;
    const winnerName = isHomeWinner ? game.homeTeam.abbreviation : game.awayTeam.abbreviation;
    const winnerScore = isHomeWinner ? game.homeScore : game.awayScore;
    const loserScore = isHomeWinner ? game.awayScore : game.homeScore;
    const margin = winnerScore - loserScore;

    return { winnerName, winnerScore, loserScore, margin };
  };

  const handlePickSubmit = async (teamId: string) => {
    if (!onPickSubmit) return;

    setIsSubmitting(true);
    try {
      await onPickSubmit(game.id, teamId);
      setIsPickModalOpen(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  const TeamSection: React.FC<{
    team: typeof game.homeTeam,
    isHome: boolean,
    score?: number | null
  }> = ({ team, isHome, score }) => {
    const isWinner = isWinningTeam(team?.id);
    const isLoser = game.isCompleted && game.winnerTeamId && !isWinner && game.winnerTeamId !== team?.id;
    const isPicked = userPickTeamId === team?.id;

    return (
      <div className={`flex items-center gap-2 flex-1 min-w-0 transition-all duration-300 ${
        isWinner ? 'scale-105' : isLoser ? 'opacity-60' : ''
      }`}>
        {/* Team Logo/Avatar - Touch target optimized */}
        <div className={`
          w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center overflow-hidden flex-shrink-0
          ${isPicked ? 'ring-2 ring-blue-500 bg-blue-50' : ''}
        `}>
          {team?.logo ? (
            <img
              src={team.logo}
              alt={`${team.name} logo`}
              loading="lazy"
              decoding="async"
              className="w-7 h-7 object-contain"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
                e.currentTarget.nextElementSibling!.style.display = 'block';
              }}
            />
          ) : null}
          <span
            className={`font-bold text-xs text-primary ${team?.logo ? 'hidden' : ''}`}
            style={{ display: team?.logo ? 'none' : 'block' }}
          >
            {team?.abbreviation || (isHome ? 'HOME' : 'AWAY')}
          </span>
        </div>

        {/* Team Info */}
        <div className="flex-1 min-w-0">
          <div className={`font-semibold text-sm truncate flex items-center gap-1 ${
            isWinner ? 'text-green-700' : isLoser ? 'text-gray-400' : 'text-gray-900'
          }`}>
            {isWinner && (
              <span className="text-yellow-500 text-xs" role="img" aria-label="Winner">🏆</span>
            )}
            {team?.abbreviation || (isHome ? 'Home' : 'Away')}
          </div>

          {/* Pick indicator - mobile optimized */}
          {isPicked && (
            <div className="flex items-center gap-1 mt-0.5">
              <svg className="w-3 h-3 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-[10px] font-medium text-blue-600">Your Pick</span>
            </div>
          )}

          {/* Family picks - compact mobile display */}
          {showFamilyPicks && familyPicks.length > 0 && team?.id && (
            <FamilyPicksDisplay picks={familyPicks} teamId={team.id} />
          )}
        </div>

        {/* Score - prominent on mobile */}
        {score !== null && score !== undefined && (
          <div className={`text-2xl font-bold tabular-nums ${
            isWinner ? 'text-green-600' : isLoser ? 'text-gray-400' : 'text-gray-900'
          }`}>
            {score}
          </div>
        )}
      </div>
    );
  };

  return (
    <>
      {/* Mobile-optimized card container */}
      <div className={`
        bg-white rounded-lg border border-gray-200 shadow-sm active:shadow-md transition-all duration-200
        p-3
        ${className}
      `}>
        {/* Compact Header - Mobile optimized */}
        <div className="flex justify-between items-start mb-2.5">
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <span>Week {game.week}</span>
            <span className="w-1 h-1 bg-gray-300 rounded-full"></span>
            <span className="truncate max-w-[140px]">{formatGameDate(game.gameDate, false)}</span>
          </div>

          {/* Status Badge - Compact */}
          {game.isCompleted && getWinnerDisplay() ? (
            <div className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 border border-green-200">
              <span className="mr-0.5" role="img" aria-label="Trophy">🏆</span>
              {getWinnerDisplay()!.winnerName}
            </div>
          ) : (
            <GameLockStatus
              status={gameStatus}
              size="small"
              showIcon={false}
            />
          )}
        </div>

        {/* Teams Display - Stacked mobile layout */}
        <div className="space-y-2 mb-2.5">
          <TeamSection
            team={game.awayTeam}
            isHome={false}
            score={game.awayScore}
          />

          <div className="h-px bg-gray-200"></div>

          <TeamSection
            team={game.homeTeam}
            isHome={true}
            score={game.homeScore}
          />
        </div>

        {/* Betting lines - Ultra compact for mobile */}
        {(game.homeSpread || game.overUnder) && (
          <div className="flex justify-center gap-3 mb-2.5 text-xs text-gray-500 font-medium">
            {game.homeSpread && (
              <div className="flex items-center gap-1">
                <span className="text-gray-400">Spread:</span>
                <span>{game.homeTeam?.abbreviation} {formatSpread(game.homeSpread)}</span>
              </div>
            )}
            {game.overUnder && (
              <div className="flex items-center gap-1">
                <span className="text-gray-400">O/U:</span>
                <span>{formatOverUnder(game.overUnder)}</span>
              </div>
            )}
          </div>
        )}

        {/* Countdown Timer - Compact mobile display */}
        {canSubmitPick && (
          <div className="mb-2.5 flex justify-center">
            <CountdownTimer
              targetTime={apiGameStatus?.lockTime || game.gameDate}
              mode="compact"
              className="text-center text-sm"
            />
          </div>
        )}

        {/* Action Area - Touch optimized */}
        {canSubmitPick && onPickSubmit && (
          <button
            onClick={() => setIsPickModalOpen(true)}
            className="w-full min-h-[44px] bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-semibold rounded-lg transition-colors duration-150 flex items-center justify-center gap-2 touch-manipulation"
            disabled={isSubmitting}
          >
            {userHasPick ? (
              <>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                Change Pick
              </>
            ) : (
              <>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Make Pick
              </>
            )}
          </button>
        )}

        {/* Pick status for locked/completed games - Mobile compact */}
        {(gameStatus === 'locked' || gameStatus === 'inProgress' || gameStatus === 'final') && userHasPick && (
          <div className="p-2.5 bg-green-50 rounded-lg border border-green-200">
            <div className="flex items-center gap-2 text-green-700">
              <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-sm font-medium flex-1 truncate">
                Picked: {userPickTeamId === game.homeTeam.id ? game.homeTeam.abbreviation : game.awayTeam.abbreviation}
              </span>
            </div>
          </div>
        )}

        {/* No pick warning for locked games */}
        {(gameStatus === 'locked' || gameStatus === 'inProgress') && !userHasPick && (
          <div className="p-2.5 bg-orange-50 rounded-lg border border-orange-200">
            <div className="flex items-center gap-2 text-orange-700">
              <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <span className="text-sm font-medium">Auto-pick assigned</span>
            </div>
          </div>
        )}
      </div>

      {/* Mobile Pick Modal */}
      {onPickSubmit && (
        <MobilePickModal
          isOpen={isPickModalOpen}
          onClose={() => setIsPickModalOpen(false)}
          game={{
            id: game.id,
            homeTeam: {
              id: game.homeTeam.id,
              name: game.homeTeam.name,
              abbreviation: game.homeTeam.abbreviation,
              logoUrl: game.homeTeam.logo
            },
            awayTeam: {
              id: game.awayTeam.id,
              name: game.awayTeam.name,
              abbreviation: game.awayTeam.abbreviation,
              logoUrl: game.awayTeam.logo
            },
            gameDate: game.gameDate,
            homeSpread: game.homeSpread,
            overUnder: game.overUnder,
            isLocked: apiGameStatus?.isLocked || false
          }}
          currentPick={userPickTeamId ? { teamId: userPickTeamId } : undefined}
          onPickSubmit={handlePickSubmit}
        />
      )}
    </>
  );
};
