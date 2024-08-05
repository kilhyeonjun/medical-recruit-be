import { HospitalName } from '../../common/enums/hospital-name.enum';

export class CreateSubscriptionDto {
  email: string;
  keywords: string[];
  hospitalName: HospitalName;
}
