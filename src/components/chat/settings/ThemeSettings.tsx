'use client';

import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { 
  Sun, 
  Moon, 
  Palette,
} from 'lucide-react';

interface ThemeSettingsProps {
  isDarkMode: boolean;
  onToggleDarkMode: () => void;
}

export function ThemeSettings({ isDarkMode, onToggleDarkMode }: ThemeSettingsProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
      className="space-y-4"
    >
      <div className="flex items-center gap-3">
        <div className={`p-2 rounded-xl ${
          isDarkMode 
            ? 'bg-gradient-to-br from-amber-500/20 to-orange-500/20' 
            : 'bg-gradient-to-br from-amber-50 to-orange-50'
        }`}>
          <Palette className={`h-4 w-4 ${
            isDarkMode ? 'text-amber-400' : 'text-amber-600'
          }`} />
        </div>
        <div>
          <h4 className={`font-medium ${
            isDarkMode ? 'text-white' : 'text-gray-900'
          }`}>
            Appearance
          </h4>
          <p className={`text-sm ${
            isDarkMode ? 'text-gray-400' : 'text-gray-600'
          }`}>
            Customize your visual experience
          </p>
        </div>
      </div>

      <div className={`rounded-2xl p-4 border ${
        isDarkMode 
          ? 'bg-gray-900/30 border-gray-800/50' 
          : 'bg-white/50 border-gray-200/50'
      }`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${
              isDarkMode 
                ? 'bg-gray-800/50' 
                : 'bg-gray-100/50'
            }`}>
              {isDarkMode ? (
                <Moon className={`h-4 w-4 ${
                  isDarkMode ? 'text-blue-400' : 'text-blue-600'
                }`} />
              ) : (
                <Sun className={`h-4 w-4 ${
                  isDarkMode ? 'text-blue-400' : 'text-blue-600'
                }`} />
              )}
            </div>
            <div>
              <p className={`font-medium ${
                isDarkMode ? 'text-white' : 'text-gray-900'
              }`}>
                {isDarkMode ? 'Dark' : 'Light'} Theme
              </p>
              <p className={`text-sm ${
                isDarkMode ? 'text-gray-400' : 'text-gray-600'
              }`}>
                {isDarkMode ? 'Easy on the eyes' : 'Classic bright interface'}
              </p>
            </div>
          </div>
          <Switch
            checked={isDarkMode}
            onCheckedChange={onToggleDarkMode}
            className="data-[state=checked]:bg-blue-600"
          />
        </div>
      </div>
    </motion.div>
  );
}