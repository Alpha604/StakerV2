import fs from 'fs';

const replaces = [
  {file: 'src/components/Crash.tsx', src: 'const startGame = () => {', dst: 'const startGame = async () => {'},
  {file: 'src/components/Flip.tsx', src: 'const handleBet = () => {', dst: 'const handleBet = async () => {'},
  {file: 'src/components/Limbo.tsx', src: 'const handleBet = () => {', dst: 'const handleBet = async () => {'},
  {file: 'src/components/Plinko.tsx', src: 'const handleDrop = () => {', dst: 'const handleDrop = async () => {'},
  {file: 'src/components/TomeOfLife.tsx', src: 'const spin = () => {', dst: 'const spin = async () => {'},
  {file: 'src/components/VideoPoker.tsx', src: 'const dealInitial = () => {', dst: 'const dealInitial = async () => {'}
];

replaces.forEach(r => {
  let content = fs.readFileSync(r.file, 'utf8');
  content = content.replace(r.src, r.dst);
  fs.writeFileSync(r.file, content);
});
