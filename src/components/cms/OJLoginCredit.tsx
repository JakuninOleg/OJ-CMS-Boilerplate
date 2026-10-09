import { oj } from '../../oj.config';
export default function OJLoginCredit() {
  return <footer className="oj-login-credit"><span>OJ CMS</span><a href={oj.developerURL} target="_blank" rel="noopener noreferrer">Разработка: Олег Якунин</a></footer>;
}
