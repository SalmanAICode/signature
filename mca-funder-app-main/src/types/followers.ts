import { User } from "@/types/user";

export type Follower = User & {
    _id: string;
    first_name: string;
    last_name: string;
    email: string;
    phone_mobile: string;
    id: string;
}