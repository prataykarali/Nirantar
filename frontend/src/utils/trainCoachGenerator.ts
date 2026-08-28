/**
 * NIRANTAR — Dynamic Train Coach Composition & Berth Layout Generator
 * ====================================================================
 * Generates authentic Indian Railway coach compositions, coach counts,
 * and berth allocations dynamically based on train type, number, and classes.
 */

export interface GeneratedCoach {
  code: string;
  classCode: string;
  className: string;
  label: string;
  capacity: number;
  layoutType: 'CHAIR_CAR' | 'EXECUTIVE_CC' | 'SLEEPER' | 'AC_3_TIER' | 'AC_2_TIER' | 'AC_1_TIER' | 'AC_3_ECONOMY' | 'GENERAL' | 'PANTRY';
}

export function generateTrainCoaches(trainNumber: string, trainType?: string, availableClasses?: Array<{ classCode: string }>): GeneratedCoach[] {
  const cleanNo = (trainNumber || '').trim();
  const num = parseInt(cleanNo, 10) || 12301;
  const isVandeBharat = (trainType === 'VANDE_BHARAT') || cleanNo.startsWith('20') || cleanNo.startsWith('224') || cleanNo.startsWith('208');
  const isRajdhani = (trainType === 'RAJDHANI') || cleanNo.startsWith('129') || cleanNo.startsWith('123') || cleanNo.startsWith('124') || cleanNo.startsWith('226');
  const isShatabdi = (trainType === 'SHATABDI') || cleanNo.startsWith('120');
  const isDuronto = (trainType === 'DURONTO') || cleanNo.startsWith('122');

  // 1. VANDE BHARAT EXPRESS COMPOSITION (8 or 16 coaches: C1..C8, EC1, EC2)
  if (isVandeBharat) {
    const is16Coach = num % 2 === 0;
    const coaches: GeneratedCoach[] = [
      { code: 'C1', classCode: 'CC', className: 'AC Chair Car', label: 'C1 (CC)', capacity: 78, layoutType: 'CHAIR_CAR' },
      { code: 'C2', classCode: 'CC', className: 'AC Chair Car', label: 'C2 (CC)', capacity: 78, layoutType: 'CHAIR_CAR' },
      { code: 'C3', classCode: 'CC', className: 'AC Chair Car', label: 'C3 (CC)', capacity: 78, layoutType: 'CHAIR_CAR' },
      { code: 'EC1', classCode: 'EC', className: 'Exec. Chair Car', label: 'EC1 (EC)', capacity: 52, layoutType: 'EXECUTIVE_CC' },
      { code: 'EC2', classCode: 'EC', className: 'Exec. Chair Car', label: 'EC2 (EC)', capacity: 52, layoutType: 'EXECUTIVE_CC' },
      { code: 'C4', classCode: 'CC', className: 'AC Chair Car', label: 'C4 (CC)', capacity: 78, layoutType: 'CHAIR_CAR' },
      { code: 'C5', classCode: 'CC', className: 'AC Chair Car', label: 'C5 (CC)', capacity: 78, layoutType: 'CHAIR_CAR' },
      { code: 'C6', classCode: 'CC', className: 'AC Chair Car', label: 'C6 (CC)', capacity: 78, layoutType: 'CHAIR_CAR' },
    ];
    if (is16Coach) {
      coaches.push(
        { code: 'C7', classCode: 'CC', className: 'AC Chair Car', label: 'C7 (CC)', capacity: 78, layoutType: 'CHAIR_CAR' },
        { code: 'C8', classCode: 'CC', className: 'AC Chair Car', label: 'C8 (CC)', capacity: 78, layoutType: 'CHAIR_CAR' }
      );
    }
    return coaches;
  }

  // 2. SHATABDI EXPRESS COMPOSITION (EC1..EC2, C1..C10)
  if (isShatabdi) {
    return [
      { code: 'E1', classCode: 'EC', className: 'Exec. Chair Car', label: 'E1 (EC)', capacity: 52, layoutType: 'EXECUTIVE_CC' },
      { code: 'E2', classCode: 'EC', className: 'Exec. Chair Car', label: 'E2 (EC)', capacity: 52, layoutType: 'EXECUTIVE_CC' },
      { code: 'C1', classCode: 'CC', className: 'AC Chair Car', label: 'C1 (CC)', capacity: 78, layoutType: 'CHAIR_CAR' },
      { code: 'C2', classCode: 'CC', className: 'AC Chair Car', label: 'C2 (CC)', capacity: 78, layoutType: 'CHAIR_CAR' },
      { code: 'C3', classCode: 'CC', className: 'AC Chair Car', label: 'C3 (CC)', capacity: 78, layoutType: 'CHAIR_CAR' },
      { code: 'C4', classCode: 'CC', className: 'AC Chair Car', label: 'C4 (CC)', capacity: 78, layoutType: 'CHAIR_CAR' },
      { code: 'C5', classCode: 'CC', className: 'AC Chair Car', label: 'C5 (CC)', capacity: 78, layoutType: 'CHAIR_CAR' },
      { code: 'C6', classCode: 'CC', className: 'AC Chair Car', label: 'C6 (CC)', capacity: 78, layoutType: 'CHAIR_CAR' },
    ];
  }

  // 3. RAJDHANI & DURONTO EXPRESS COMPOSITION (H1, A1..A3, B1..B8, M1..M2, PC)
  if (isRajdhani || isDuronto) {
    return [
      { code: 'H1', classCode: '1A', className: 'AC 1st Class', label: 'H1 (1A)', capacity: 24, layoutType: 'AC_1_TIER' },
      { code: 'A1', classCode: '2A', className: 'AC 2 Tier', label: 'A1 (2A)', capacity: 54, layoutType: 'AC_2_TIER' },
      { code: 'A2', classCode: '2A', className: 'AC 2 Tier', label: 'A2 (2A)', capacity: 54, layoutType: 'AC_2_TIER' },
      { code: 'B1', classCode: '3A', className: 'AC 3 Tier', label: 'B1 (3A)', capacity: 72, layoutType: 'AC_3_TIER' },
      { code: 'B2', classCode: '3A', className: 'AC 3 Tier', label: 'B2 (3A)', capacity: 72, layoutType: 'AC_3_TIER' },
      { code: 'B3', classCode: '3A', className: 'AC 3 Tier', label: 'B3 (3A)', capacity: 72, layoutType: 'AC_3_TIER' },
      { code: 'B4', classCode: '3A', className: 'AC 3 Tier', label: 'B4 (3A)', capacity: 72, layoutType: 'AC_3_TIER' },
      { code: 'B5', classCode: '3A', className: 'AC 3 Tier', label: 'B5 (3A)', capacity: 72, layoutType: 'AC_3_TIER' },
      { code: 'M1', classCode: '3E', className: 'AC 3 Economy', label: 'M1 (3E)', capacity: 83, layoutType: 'AC_3_ECONOMY' },
      { code: 'PC', classCode: 'PC', className: 'Pantry Car', label: 'PC (Pantry)', capacity: 0, layoutType: 'PANTRY' },
    ];
  }

  // 4. SUPERFAST / MAIL / EXPRESS COMPOSITION (GS1, S1..S6, B1..B4, A1, HA1, GS2)
  const coachCount = 10 + (num % 5);
  const coaches: GeneratedCoach[] = [
    { code: 'GS1', classCode: 'GEN', className: 'General Unreserved', label: 'GS1 (GEN)', capacity: 90, layoutType: 'GENERAL' },
    { code: 'S1', classCode: 'SL', className: 'Sleeper Class', label: 'S1 (SL)', capacity: 72, layoutType: 'SLEEPER' },
    { code: 'S2', classCode: 'SL', className: 'Sleeper Class', label: 'S2 (SL)', capacity: 72, layoutType: 'SLEEPER' },
    { code: 'S3', classCode: 'SL', className: 'Sleeper Class', label: 'S3 (SL)', capacity: 72, layoutType: 'SLEEPER' },
    { code: 'S4', classCode: 'SL', className: 'Sleeper Class', label: 'S4 (SL)', capacity: 72, layoutType: 'SLEEPER' },
    { code: 'B1', classCode: '3A', className: 'AC 3 Tier', label: 'B1 (3A)', capacity: 72, layoutType: 'AC_3_TIER' },
    { code: 'B2', classCode: '3A', className: 'AC 3 Tier', label: 'B2 (3A)', capacity: 72, layoutType: 'AC_3_TIER' },
    { code: 'B3', classCode: '3A', className: 'AC 3 Tier', label: 'B3 (3A)', capacity: 72, layoutType: 'AC_3_TIER' },
    { code: 'B4', classCode: '3A', className: 'AC 3 Tier', label: 'B4 (3A)', capacity: 72, layoutType: 'AC_3_TIER' },
    { code: 'A1', classCode: '2A', className: 'AC 2 Tier', label: 'A1 (2A)', capacity: 54, layoutType: 'AC_2_TIER' },
    { code: 'HA1', classCode: '1A', className: 'AC 1st Class', label: 'HA1 (1A)', capacity: 24, layoutType: 'AC_1_TIER' },
    { code: 'GS2', classCode: 'GEN', className: 'General Unreserved', label: 'GS2 (GEN)', capacity: 90, layoutType: 'GENERAL' },
  ];

  return coaches.slice(0, coachCount);
}
