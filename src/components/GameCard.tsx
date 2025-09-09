import React from 'react';
import { Game, GameStatus } from '../types/api';
import { GameLockStatus, useGameStatus } from './GameLockStatus';
import { CountdownTimer } from './CountdownTimer';
import { PickDeadlineIndicator } from './PickDeadlineIndicator';
import { formatGameDate, getGameLockTime } from '../utils/timeUtils';

interface GameCardProps {
  game: Game | GameStatus;
  userHasPick?: boolean;
  userPickTeamId?: string;
  onPickSubmit?: (gameId: string, teamId: string) => void;
  onViewPick?: (gameId: string) => void;
  className?: string;
  lockOffsetMinutes?: number;
  isAutoPickEnabled?: boolean;
  compactMode?: boolean;
}

// Utility function to format odds for display
const formatSpread = (spread: number, isHome: boolean = true): string => {
  const points = Math.abs(spread) / 100;
  const sign = spread > 0 ? '+' : '-';
  return `${sign}${points.toFixed(1)}`;
};

const formatOverUnder = (overUnder: number): string => {
  return (Math.abs(overUnder) / 100).toFixed(1);
};

export const GameCard: React.FC<GameCardProps> = ({
  game,
  userHasPick = false,
  userPickTeamId,
  onPickSubmit,
  onViewPick,
  className = '',
  lockOffsetMinutes = 0,
  isAutoPickEnabled = false,
  compactMode = false
}) => {
  // Use API lock status if available, otherwise calculate locally
  const isGameStatusAPI = 'isLocked' in game;
  const apiGameStatus = isGameStatusAPI ? game as GameStatus : null;
  const gameStatus = useGameStatus(game.gameDate, game.isCompleted, lockOffsetMinutes);
  const lockTime = apiGameStatus?.lockTime ? new Date(apiGameStatus.lockTime) : getGameLockTime(game.gameDate, lockOffsetMinutes);
  const canSubmitPick = isGameStatusAPI ? (!apiGameStatus?.isLocked && !game.isCompleted) : (gameStatus === 'upcoming');

  const TeamSection: React.FC<{ 
    team: typeof game.homeTeam, 
    isHome: boolean, 
    score?: number 
  }> = ({ team, isHome, score }) => (
    <div className="text-center">
      <div className={`
        ${compactMode ? 'w-12 h-12' : 'w-16 h-16'} 
        bg-primary/10 rounded-full flex items-center justify-center mb-2 overflow-hidden
        ${userPickTeamId === team?.id ? 'ring-2 ring-blue-500 bg-blue-50' : ''}
      `}>
        {team?.logo ? (
          <img 
            src={team.logo} 
            alt={`${team.name} logo`}
            className={`${compactMode ? 'w-8 h-8' : 'w-12 h-12'} object-contain`}
            onError={(e) => {
              e.currentTarget.style.display = 'none';
              e.currentTarget.nextElementSibling!.style.display = 'block';
            }}
          />
        ) : null}
        <span 
          className={`font-bold ${compactMode ? 'text-sm' : 'text-lg'} text-primary ${team?.logo ? 'hidden' : ''}`}
          style={{ display: team?.logo ? 'none' : 'block' }}
        >
          {team?.abbreviation || (isHome ? 'HOME' : 'AWAY')}
        </span>
      </div>
      
      <div className={`font-semibold ${compactMode ? 'text-sm' : 'text-base'}`}>
        {compactMode ? team?.abbreviation : team?.name || `${isHome ? 'Home' : 'Away'} Team`}
      </div>
      
      {!compactMode && (
        <div className="text-sm text-muted-foreground">
          {team?.abbreviation}
        </div>
      )}
      
      {score !== null && score !== undefined && (
        <div className={`${compactMode ? 'text-xl' : 'text-2xl'} font-bold mt-2`}>
          {score}
        </div>
      )}
      
      {/* Pick indicator */}
      {userPickTeamId === team?.id && (
        <div className="mt-1">
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800">
            <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Your Pick
          </span>
        </div>
      )}
    </div>
  );

  const PickButtons: React.FC = () => {
    if (!canSubmitPick || !onPickSubmit) return null;

    return (
      <div className="mt-4 grid grid-cols-2 gap-2">
        <button
          onClick={() => onPickSubmit(game.id, game.awayTeam.id)}
          disabled={userPickTeamId === game.awayTeam.id}
          className={`
            px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 touch-manipulation
            ${userPickTeamId === game.awayTeam.id
              ? 'bg-blue-500 text-white shadow-md'
              : 'bg-gray-100 text-gray-700 hover:bg-blue-50 hover:text-blue-700 active:scale-95'
            }
          `}
        >
          Pick {game.awayTeam.abbreviation}
        </button>
        <button
          onClick={() => onPickSubmit(game.id, game.homeTeam.id)}
          disabled={userPickTeamId === game.homeTeam.id}
          className={`
            px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 touch-manipulation
            ${userPickTeamId === game.homeTeam.id
              ? 'bg-blue-500 text-white shadow-md'
              : 'bg-gray-100 text-gray-700 hover:bg-blue-50 hover:text-blue-700 active:scale-95'
            }
          `}
        >
          Pick {game.homeTeam.abbreviation}
        </button>
      </div>
    );
  };

  return (
    <div className={`
      bg-white rounded-lg border shadow-sm hover:shadow-md transition-all duration-200
      ${compactMode ? 'p-4' : 'p-6'}
      ${className}
    `}>
      {/* Header with game info and status */}
      <div className="flex justify-between items-start mb-4">
        <div className="space-y-1">
          <div className={`text-muted-foreground ${compactMode ? 'text-xs' : 'text-sm'}`}>
            Game #{game.id} • Week {game.week}
          </div>
          {!compactMode && (
            <div className="text-sm font-medium text-gray-700">
              {formatGameDate(game.gameDate, true)}
            </div>
          )}
        </div>
        
        <div className="flex flex-col items-end space-y-2">
          <GameLockStatus 
            status={gameStatus}
            size={compactMode ? 'small' : 'medium'}
            showIcon={!compactMode}
          />
          
          {canSubmitPick && (
            <CountdownTimer 
              targetTime={apiGameStatus?.lockTime || game.gameDate}
              mode={compactMode ? 'compact' : 'detailed'}
              className="text-right"
            />
          )}
        </div>
      </div>

      {/* Teams display */}
      <div className="flex items-center justify-between mb-4">
        <TeamSection 
          team={game.awayTeam} 
          isHome={false} 
          score={game.awayScore} 
        />
        
        <div className={`${compactMode ? 'text-xl' : 'text-2xl'} font-bold text-muted-foreground`}>
          @
        </div>
        
        <TeamSection 
          team={game.homeTeam} 
          isHome={true} 
          score={game.homeScore} 
        />
      </div>

      {/* Betting lines */}
      {(game.homeSpread || game.overUnder) && !compactMode && (
        <div className="flex justify-center space-x-4 mb-4 text-sm text-gray-600">
          {game.homeSpread && (
            <div>
              {game.homeTeam?.abbreviation} {formatSpread(game.homeSpread)}
            </div>
          )}
          {game.overUnder && (
            <div>
              O/U: {formatOverUnder(game.overUnder)}
            </div>
          )}
        </div>
      )}

      {/* Pick deadline and submission interface */}
      {gameStatus === 'upcoming' && (
        <div className="space-y-3">
          <PickDeadlineIndicator
            deadline={lockTime}
            gameId={game.id}
            userHasPick={userHasPick}
            isAutoPickEnabled={isAutoPickEnabled}
            compact={compactMode}
          />
          
          <PickButtons />
        </div>
      )}

      {/* Pick status for locked/completed games */}
      {(gameStatus === 'locked' || gameStatus === 'inProgress' || gameStatus === 'final') && userHasPick && (
        <div className="mt-4 p-3 bg-green-50 rounded-lg border border-green-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center text-green-700">
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-sm font-medium">
                Pick submitted: {userPickTeamId === game.homeTeam.id ? game.homeTeam.name : game.awayTeam.name}
              </span>
            </div>
            {onViewPick && (
              <button
                onClick={() => onViewPick(game.id)}
                className="text-green-600 text-sm hover:text-green-800 transition-colors"
              >
                View
              </button>
            )}
          </div>
        </div>
      )}

      {/* Auto-pick indicator */}
      {gameStatus === 'locked' && !userHasPick && isAutoPickEnabled && (
        <div className="mt-4 p-3 bg-orange-50 rounded-lg border border-orange-200">
          <div className="flex items-center text-orange-700">
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-sm">
              Auto-pick will be assigned
            </span>
          </div>
        </div>
      )}
    </div>
  );
};